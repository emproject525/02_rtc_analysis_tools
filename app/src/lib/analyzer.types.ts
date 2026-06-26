import type { ConnectionStateSnapshot } from "./collector.types";

/** 선택된 candidate-pair / transport 기반 연결 경로 정보 (peer당 1개). */
export interface TransportReport {
  /** host | srflx | prflx | relay (relay면 TURN 경유). */
  localCandidateType?: RTCIceCandidateType;
  remoteCandidateType?: RTCIceCandidateType;
  /** udp | tcp */
  protocol?: string;
  /** connection RTT (초). */
  currentRoundTripTime?: number;
  availableOutgoingBitrate?: number;
  availableIncomingBitrate?: number;
  dtlsState?: RTCDtlsTransportState;
}

/** recv(inbound) / send(outbound) 트랙 1개의 가공된 지표. */
export interface TrackReport {
  direction: "inbound" | "outbound";
  kind: "audio" | "video";
  ssrc?: number;
  mid: string | null;
  trackId: string | null;
  /** mimeType (예: video/VP8). */
  codec?: string;
  /** bitrate (bps) — 직전 샘플과 미분한 파생값. */
  bitrate?: number;
  /** 손실률 (%) — 미분 파생값. */
  packetLossRate?: number;
  jitter?: number;
  /** RTT (초). */
  roundTripTime?: number;
  frameWidth?: number;
  frameHeight?: number;
  framesPerSecond?: number;
  nackCount?: number;
  pliCount?: number;
  freezeCount?: number;
  audioLevel?: number;
}

/**
 * analyzer.analyze() 산출물 = 서버로 POST 하는 Report 1건.
 * SDK ↔ 수집 서버 ↔ 대시보드가 공유하는 계약.
 */
export interface Report {
  peerId: string;
  /** Report 생성 시각 (epoch ms). */
  timestamp: number;
  connection: ConnectionStateSnapshot;
  transport: TransportReport;
  recv: TrackReport[];
  send: TrackReport[];
}
