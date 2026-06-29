import type { Report } from "@rtc/peer-analyst";

/** peer당 series ring buffer 크기 (2초 간격이면 ~10분치). */
const SERIES_MAX = 300;
/** 무수신 evict TTL. */
const STALE_MS = 30_000;
/** stale 점검 주기. */
const SWEEP_MS = 10_000;

export type HubEvent =
  | { kind: "report"; report: Report }
  | { kind: "gone"; peerId: string };

type Listener = (event: HubEvent) => void;

interface PeerEntry {
  /** 현재 상태 — 연결 목록·상세 표시용. */
  latest: Report;
  /** 최근 N개 롤링 윈도우 — 그래프용. */
  series: Report[];
  /** 마지막 수신 시각 (Date.now) — stale evict 기준. */
  lastSeenAt: number;
}

/**
 * 수집한 Report를 메모리에 모으고 SSE 구독자에게 브로드캐스트한다.
 * docs/02_server.md "hub" 참고. 단일 프로세스 전제(globalThis 싱글톤).
 */
class Hub {
  private readonly _peers = new Map<string, PeerEntry>();
  private readonly _listeners = new Set<Listener>();
  private _sweepTimer: ReturnType<typeof setInterval> | undefined;

  /** Report 1건 수집 → latest 교체 + series ring + 구독자 통지. */
  push = (report: Report) => {
    const now = Date.now();
    const entry = this._peers.get(report.peerId);
    if (entry) {
      entry.latest = report;
      entry.series.push(report);
      if (entry.series.length > SERIES_MAX) entry.series.shift();
      entry.lastSeenAt = now;
    } else {
      this._peers.set(report.peerId, {
        latest: report,
        series: [report],
        lastSeenAt: now,
      });
    }
    this._emit({ kind: "report", report });
    this._ensureSweep();
  };

  /** 현재 모든 peer의 latest (SSE 초기 스냅샷). */
  snapshot = (): Report[] =>
    Array.from(this._peers.values(), (entry) => entry.latest);

  /** SSE 구독. 해제 함수를 돌려준다. */
  subscribe = (fn: Listener): (() => void) => {
    this._listeners.add(fn);
    return () => {
      this._listeners.delete(fn);
    };
  };

  private _emit = (event: HubEvent) => {
    for (const fn of this._listeners) fn(event);
  };

  /** 첫 push 때 sweep 타이머를 한 번만 켠다. */
  private _ensureSweep = () => {
    if (this._sweepTimer) return;
    this._sweepTimer = setInterval(this._sweep, SWEEP_MS);
  };

  /** TTL 지난 peer를 evict하고 gone 통지. */
  private _sweep = () => {
    const now = Date.now();
    for (const [peerId, entry] of this._peers) {
      if (now - entry.lastSeenAt > STALE_MS) {
        this._peers.delete(peerId);
        this._emit({ kind: "gone", peerId });
      }
    }
  };
}

// globalThis 싱글톤 — Next의 HMR·route별 번들 분리로 모듈 지역 인스턴스가
// 중복 생성되는 것을 막아 POST/SSE route가 같은 hub를 공유한다.
const g = globalThis as typeof globalThis & { __peerAnalystHub__?: Hub };
export const hub: Hub = (g.__peerAnalystHub__ ??= new Hub());
