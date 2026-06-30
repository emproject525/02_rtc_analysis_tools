import type { Report } from "@rtc/peer-analyst";

/** peer당 series ring buffer 크기 (2초 간격이면 ~10분치). */
const SERIES_MAX = 300;
/** 무수신 → ended 표시 TTL. */
const STALE_MS = 30_000;
/** ended 점검 주기. */
const SWEEP_MS = 10_000;
/** 보관 peer 상한 — 초과 시 가장 오래 ended된 peer부터 실제 제거(gone). */
const MAX_PEERS = 100;

export type HubEvent =
  | { kind: "report"; report: Report }
  | { kind: "ended"; peerId: string }
  | { kind: "gone"; peerId: string };

/** SSE 초기 스냅샷 1건 — peer의 현재값 + ended 여부. */
export interface SnapshotEntry {
  report: Report;
  ended: boolean;
}

type Listener = (event: HubEvent) => void;

interface PeerEntry {
  /** 현재 상태 — 연결 목록·상세 표시용. */
  latest: Report;
  /** 최근 N개 롤링 윈도우 — 그래프용. */
  series: Report[];
  /** 마지막 수신 시각 (Date.now). */
  lastSeenAt: number;
  /** ended로 표시된 시각. 살아있으면 undefined. */
  endedAt?: number;
}

/**
 * 수집한 Report를 메모리에 모으고 SSE 구독자에게 브로드캐스트한다.
 * okf `server/modules/hub` 참고. 단일 프로세스 전제(globalThis 싱글톤).
 *
 * 무수신 peer는 제거하지 않고 ended로 표시해 목록에 남긴다(끊긴 연결도 추적).
 * 실제 제거(gone)는 보관 상한(MAX_PEERS)을 넘을 때 오래 ended된 것부터.
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
      entry.endedAt = undefined; // 다시 수신되면 부활.
    } else {
      this._peers.set(report.peerId, {
        latest: report,
        series: [report],
        lastSeenAt: now,
      });
      this._evictIfOverCap();
    }
    this._emit({ kind: "report", report });
    this._ensureSweep();
  };

  /** 현재 모든 peer의 latest + ended 여부 (SSE 초기 스냅샷). */
  snapshot = (): SnapshotEntry[] =>
    Array.from(this._peers.values(), (entry) => ({
      report: entry.latest,
      ended: entry.endedAt != null,
    }));

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

  /** TTL 지난 peer를 ended로 표시(유지). 제거는 안 한다. */
  private _sweep = () => {
    const now = Date.now();
    for (const [peerId, entry] of this._peers) {
      if (entry.endedAt == null && now - entry.lastSeenAt > STALE_MS) {
        entry.endedAt = now;
        this._emit({ kind: "ended", peerId });
      }
    }
  };

  /** 보관 상한 초과 시 가장 오래 ended된 peer부터 제거(gone). */
  private _evictIfOverCap = () => {
    while (this._peers.size > MAX_PEERS) {
      let victim: string | undefined;
      let oldest = Infinity;
      for (const [peerId, entry] of this._peers) {
        // ended된 것 우선, 그중 가장 오래된 것. (ended가 없으면 가장 오래된 수신)
        const rank = entry.endedAt ?? entry.lastSeenAt;
        if (rank < oldest) {
          oldest = rank;
          victim = peerId;
        }
      }
      if (victim == null) break;
      this._peers.delete(victim);
      this._emit({ kind: "gone", peerId: victim });
    }
  };
}

// globalThis 싱글톤 — Next의 HMR·route별 번들 분리로 모듈 지역 인스턴스가
// 중복 생성되는 것을 막아 POST/SSE route가 같은 hub를 공유한다.
const g = globalThis as typeof globalThis & { __peerAnalystHub__?: Hub };
export const hub: Hub = (g.__peerAnalystHub__ ??= new Hub());
