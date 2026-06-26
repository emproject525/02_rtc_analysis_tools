import type { Report } from "../analyzer/analyzer.types";
import type { ObserveOptions } from "../peer-monitor/peer-monitor.types";

/**
 * 가공된 Report를 설정된 출력 대상(콘솔 / 콜백 / 서버)으로 fan-out 한다.
 * 서버 출력은 배치 큐에 모았다 flush 시점에 전송하고,
 * 페이지 이탈 시 sendBeacon으로 마지막 배치를 보낸다.
 */
export class Reporter {
  private readonly _queue: Report[] = [];

  constructor(private readonly _options: ObserveOptions) {}

  send = (report: Report) => {
    if (this._options.console) console.debug("[PeerAnalyst]", report);
    this._options.onReport?.(report);
    if (this._options.serverUrl) this._queue.push(report);
    // TODO: 큐 크기/주기 기준으로 flush 트리거
  };

  /** 모아둔 배치를 서버로 전송. */
  flush = () => {
    const { serverUrl } = this._options;
    if (!serverUrl || this._queue.length === 0) return;
    // TODO: navigator.sendBeacon(serverUrl, JSON.stringify(this._queue))
    this._queue.length = 0;
  };

  dispose = () => {
    this.flush();
  };
}
