import type { Report } from "../analyzer/analyzer.types";
import type { ObserveOptions } from "../peer-monitor/peer-monitor.types";
import { SDK_VERSION } from "../version";
import type { ReportEnvelope } from "./reporter.types";

/** 큐 상한 — 서버 다운으로 재시도가 쌓일 때 메모리 보호(초과 시 오래된 것 드롭). */
const MAX_QUEUE = 100;

/**
 * 가공된 Report를 설정된 출력 대상(콘솔 / 콜백 / 서버)으로 fan-out 한다.
 * 서버 출력은 봉투(ReportEnvelope)에 담아 fetch로 POST 한다.
 *
 * - 현재 전송 정책: Report 생성 시기에 맞춰 즉시 전송(배치=1). 큐/flush 구조는
 *   유지하므로 나중에 주기·크기 기반 배치로 바꾸기 쉽다.
 * - 전송 실패: 큐에 남겨 다음 flush에서 재시도. 상한 초과분은 오래된 것부터 드롭.
 * - 페이지 이탈: keepalive fetch로 마지막 큐를 보낸다(unload 중에도 전송 보장).
 */
export class Reporter {
  private readonly _queue: Report[] = [];
  /** 전송 중복 방지 — 앞 flush가 끝나기 전 다음 flush 진입을 막는다. */
  private _sending = false;

  constructor(private readonly _options: ObserveOptions) {}

  send = (report: Report) => {
    if (this._options.console) console.debug("[PeerAnalyst]", report);
    this._options.onReport?.(report);
    if (!this._options.serverUrl) return;
    this._queue.push(report);
    this._crop();
    // 현재 정책: 생성 즉시 전송. 실패해도 큐에 남아 다음 send/flush에서 재시도된다.
    void this.flush();
  };

  /**
   * 큐에 쌓인 Report들을 봉투에 담아 서버로 POST 한다.
   * @param keepalive 페이지 unload 중 호출이면 true — 전송 보장(평상시엔 64KB
   *   제한·불필요 오버헤드를 피하려 false).
   */
  flush = async (keepalive = false): Promise<void> => {
    const { serverUrl } = this._options;
    if (!serverUrl) return;
    if (this._sending) return; // 이미 전송 중 — 남은 큐는 다음 기회에
    if (this._queue.length === 0) return;

    this._sending = true;
    const batch = this._queue.slice(); // 이번에 보낼 스냅샷
    try {
      const headers: Record<string, string> = {
        "content-type": "application/json",
        ...((await this._options.getHeaders?.()) ?? {}),
      };
      const envelope: ReportEnvelope = {
        sentAt: Date.now(),
        sdkVersion: SDK_VERSION,
        reports: batch,
      };
      const res = await fetch(serverUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(envelope),
        keepalive,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // 성공: 보낸 만큼만 제거(전송 중 새로 쌓인 Report는 보존).
      this._queue.splice(0, batch.length);
    } catch {
      // 실패: 큐 유지 → 다음 flush에서 재시도. 상한 초과분은 오래된 것부터 드롭.
      this._crop();
    } finally {
      this._sending = false;
    }
  };

  /** 감시 종료 — 남은 큐를 마지막으로 전송(앱 주도 종료라 page는 살아있음). */
  dispose = () => {
    void this.flush();
  };

  /** 큐 상한 유지 — 초과 시 가장 오래된 Report부터 버린다. */
  private _crop = () => {
    if (this._queue.length > MAX_QUEUE) {
      this._queue.splice(0, this._queue.length - MAX_QUEUE);
    }
  };
}
