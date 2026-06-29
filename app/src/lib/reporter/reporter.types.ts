import type { Report } from "../analyzer";

/**
 * 서버로 POST 하는 배치 봉투 — SDK ↔ 수집 서버가 공유하는 계약.
 * 원시 배열 대신 봉투로 감싸 전송 메타(버전·시각)를 함께 싣는다.
 */
export interface ReportEnvelope {
  /** 봉투 전송 시각 (epoch ms). */
  sentAt: number;
  /** SDK 버전 — 서버가 스키마 호환성 분기에 쓴다. */
  sdkVersion: string;
  /** 이번 배치에 담긴 Report들 (peer 단위 Reporter라 같은 peerId 시계열). */
  reports: Report[];
}

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
