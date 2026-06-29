import { Analyzer } from "../analyzer";
import { Collector } from "../collector";
import { Reporter } from "../reporter";
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
  /** observe 시작 시각 (epoch ms) — 연결 지속시간 계산 기준. */
  readonly startedAt = Date.now();

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
    const report = this._analyzer.analyze(raw, this.id, this.startedAt);
    this._reporter.send(report);
  };

  /**
   * 큐에 남은 Report를 강제 전송한다. 페이지 이탈 처리용.
   * @param keepalive unload 중 호출이면 true.
   */
  flush = (keepalive = false) => this._reporter.flush(keepalive);

  /** 감시 종료 — 마지막 폴링으로 잔여 전이 flush + 타이머/리스너 정리. */
  dispose = async () => {
    clearInterval(this._timer);
    // 직전 collect 이후 버퍼에 쌓인 상태 전이/ICE 에러까지 마지막으로 내보낸다.
    try {
      await this._tick();
    } catch {
      // 종료 중 getStats 실패(이미 닫힌 연결 등)는 무시.
    }
    this._collector.dispose();
    this._reporter.dispose();
  };
}
