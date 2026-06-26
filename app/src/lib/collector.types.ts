/** 이벤트(push)로 추적하는 연결 단위 상태. */
export interface ConnectionStateSnapshot {
  connectionState: RTCPeerConnectionState;
  iceConnectionState: RTCIceConnectionState;
  iceGatheringState: RTCIceGatheringState;
  signalingState: RTCSignalingState;
}

/**
 * getTransceivers() 스냅샷 — getStats 줄(ssrc)을 트랙으로 라벨링하기 위한 메타.
 * 라이브 폴링 대상이 아니라 collect() 시점의 매핑 정보.
 */
export interface TransceiverSnapshot {
  mid: string | null;
  direction: RTCRtpTransceiverDirection;
  currentDirection: RTCRtpTransceiverDirection | null;
  senderTrackId: string | null;
  receiverTrackId: string | null;
}

/**
 * collector.collect() 1회 산출물 — 가공 전 원본 묶음.
 * (이벤트 상태 + getStats 원본 + transceiver 스냅)
 */
export interface RawSample {
  /** 수집 시각 (performance.now 기준 ms). 미분 계산용. */
  timestamp: number;
  state: ConnectionStateSnapshot;
  /** getStats() 원본 리포트. analyzer가 type별로 해석. */
  stats: RTCStatsReport;
  transceivers: TransceiverSnapshot[];
}
