import { Analyzer } from "./analyzer.module";
import { Collector } from "./collector.module";
import { Reporter } from "./reporter.module";
import type { ObserveOptions } from "./peer-monitor.types";

const DEFAULT_INTERVAL = 2000;

/**
 * peer 1개의 감시 수명주기를 오케스트레이션한다.
 * 타이머·id·옵션만 소유하고, 읽기(collector)/가공(analyzer)/출력(reporter)은
 * 각 모듈에 위임한다.
 */
export class PeerMonitor {
  private readonly _collector: Collector;
  private readonly _analyzer: Analyzer;
  private readonly _reporter: Reporter;
  private readonly _timer: ReturnType<typeof setInterval>;

  constructor(
    readonly peer: RTCPeerConnection,
    readonly id: string,
    readonly options: ObserveOptions = {},
  ) {
    this._collector = new Collector(peer);
    this._analyzer = new Analyzer();
    this._reporter = new Reporter(options);
    this._timer = setInterval(this._tick, options.interval ?? DEFAULT_INTERVAL);
  }

  /** 폴링 1회: 수집 → 가공 → 출력. */
  private _tick = async () => {
    const raw = await this._collector.collect();
    const report = this._analyzer.analyze(raw, this.id);
    this._reporter.send(report);
  };

  /** 감시 종료 — 타이머/리스너 정리 + 마지막 배치 flush. */
  dispose = () => {
    clearInterval(this._timer);
    this._collector.dispose();
    this._reporter.dispose();
  };
}
