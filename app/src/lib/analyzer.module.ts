import type { RawSample } from "./collector.types";
import type { Report } from "./analyzer.types";

/**
 * raw 샘플을 정규화된 Report로 가공한다.
 * bitrate/손실률 등은 누적값 미분이라 직전 샘플을 내부에 보관한다.
 * (peer마다 Analyzer 1개 → 미분 상태 격리)
 */
export class Analyzer {
  private _prev: RawSample | null = null;

  analyze = (raw: RawSample, peerId: string, startedAt: number): Report => {
    const prev = this._prev;
    this._prev = raw;

    const report: Report = {
      peerId,
      startedAt,
      timestamp: Date.now(),
      connection: raw.state,
      transport: {},
      recv: [],
      send: [],
    };

    // 누적값 미분은 직전 샘플이 있어야 가능. 첫 샘플은 상태만 채운다.
    if (!prev) return report;

    // TODO: prev.stats vs raw.stats 미분으로 파생 지표 계산
    //       - transport: candidate-pair/transport/candidate 해석
    //       - recv: inbound-rtp + transceiver 매핑 (bitrate↓/손실률/jitter…)
    //       - send: outbound-rtp + remote-inbound-rtp(RTT) 매핑
    return report;
  };

  /** 직전 샘플 초기화 (재협상/ICE restart 등으로 미분 기준을 끊을 때). */
  reset = () => {
    this._prev = null;
  };
}
