import type { Report } from "./analyzer.types";

/**
 * 출력 채널 한 곳의 계약. console / callback / server가 각각 구현.
 * (지금은 Reporter가 직접 fan-out 하지만, 채널이 늘면 이 인터페이스로 분리)
 */
export interface ReportSink {
  send(report: Report): void;
  /** 모아둔 배치를 강제 전송 (페이지 이탈 등). */
  flush?(): void;
  dispose?(): void;
}
