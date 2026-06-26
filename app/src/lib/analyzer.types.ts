import type { ConnectionStateSnapshot } from "./collector.types";

/** 선택된 candidate-pair / transport 기반 연결 경로 정보 (peer당 1개). */
export interface TransportReport {
  /** host | srflx | prflx | relay (relay면 TURN 경유). */
  localCandidateType?: RTCIceCandidateType;
  remoteCandidateType?: RTCIceCandidateType;
  /** udp | tcp */
  protocol?: string;
  /** relay일 때 TURN 전송 프로토콜. */
  relayProtocol?: string;
  localAddress?: string;
  localPort?: number;
  remoteAddress?: string;
  remotePort?: number;
  /** connection RTT (초). */
  currentRoundTripTime?: number;
  availableOutgoingBitrate?: number;
  availableIncomingBitrate?: number;
  /** candidate-pair state (succeeded 등). */
  candidatePairState?: string;
  nominated?: boolean;
  dtlsState?: RTCDtlsTransportState;
  iceState?: RTCIceTransportState;
}

/** recv(inbound) / send(outbound) 트랙 1개의 가공된 지표. */
export interface TrackReport {
  /** rtp 방향. */
  direction: "inbound" | "outbound";
  kind: "audio" | "video";
  ssrc?: number;
  mid: string | null;
  /** 그 시점의 track.id (replaceTrack 시 바뀜, 시리즈는 ssrc로 유지). */
  trackId: string | null;
  /** simulcast 레이어 식별자 (outbound). */
  rid?: string;
  /** transceiver currentDirection (sendrecv / recvonly …). */
  transceiverDirection?: RTCRtpTransceiverDirection;
  /** mimeType (예: video/VP8). */
  codec?: string;
  /** bitrate (bps) — 직전 샘플과 미분한 파생값. */
  bitrate?: number;
  /** 손실률 (%) — 미분 파생값. */
  packetLossRate?: number;
  /** 최근 구간 손실률 (0~1) — send는 remote-inbound-rtp 기준. */
  fractionLost?: number;
  /** 누적 패킷 수 (recv). */
  packetsReceived?: number;
  /** 누적 패킷 수 (send). */
  packetsSent?: number;
  jitter?: number;
  /** RTT (초). */
  roundTripTime?: number;
  /** 평균 jitter buffer 지연 (초) — 미분 파생값. */
  jitterBufferDelay?: number;
  frameWidth?: number;
  frameHeight?: number;
  framesPerSecond?: number;
  /** 디코딩 누적 프레임 (recv). */
  framesDecoded?: number;
  /** 인코딩 누적 프레임 (send). */
  framesEncoded?: number;
  /** 드롭 누적 프레임 (recv). */
  framesDropped?: number;
  nackCount?: number;
  pliCount?: number;
  firCount?: number;
  freezeCount?: number;
  totalFreezesDuration?: number;
  /** 인코더 목표 비트레이트 (outbound). */
  targetBitrate?: number;
  /** 화질 제한 원인 (outbound): cpu / bandwidth / none. */
  qualityLimitationReason?: string;
  audioLevel?: number;
}

/**
 * analyzer.analyze() 산출물 = 서버로 POST 하는 Report 1건.
 * SDK ↔ 수집 서버 ↔ 대시보드가 공유하는 계약.
 */
export interface Report {
  peerId: string;
  /** observe 시작 시각 (epoch ms) — 연결 지속시간 = timestamp − startedAt. */
  startedAt: number;
  /** Report 생성 시각 (epoch ms). */
  timestamp: number;
  connection: ConnectionStateSnapshot;
  transport: TransportReport;
  recv: TrackReport[];
  send: TrackReport[];
}
