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
 * 폴링 사이에 일어난 연결 상태 전이 1건.
 * push 이벤트는 즉시 보내지 않고 버퍼에 쌓였다가 다음 collect()에 실린다.
 * (state를 그냥 덮어쓰면 집계 간격 안의 짧은 전이가 last-write-wins로 사라지므로)
 */
export interface StateTransition {
  /** 전이 발생 시각 (performance.now 기준 ms). */
  timestamp: number;
  /** 바뀐 상태 종류. */
  kind: keyof ConnectionStateSnapshot;
  /** 직전 값. */
  from: string;
  /** 바뀐 값. */
  to: string;
}

/**
 * icecandidateerror 이벤트 1건 — STUN/TURN 후보 수집 실패.
 * 순간 이벤트라 폴링으론 못 잡으므로 전이 버퍼와 같은 방식으로 누적한다.
 */
export interface IceCandidateError {
  /** 발생 시각 (performance.now 기준 ms). */
  timestamp: number;
  errorCode: number;
  errorText: string;
  url: string;
  address: string | null;
  port: number | null;
}

/**
 * collector.collect() 1회 산출물 — 가공 전 원본 묶음.
 * (이벤트 상태 + getStats 원본 + transceiver 스냅 + 직전 폴링 이후 버퍼)
 */
export interface RawSample {
  /** 수집 시각 (performance.now 기준 ms). 미분 계산용. */
  timestamp: number;
  state: ConnectionStateSnapshot;
  /** getStats() 원본 리포트. analyzer가 type별로 해석. */
  stats: RTCStatsReport;
  transceivers: TransceiverSnapshot[];
  /** 직전 collect 이후 쌓인 상태 전이. drain 방식이라 이 묶음 이후 비워진다. */
  transitions: StateTransition[];
  /** 직전 collect 이후 발생한 ICE 후보 수집 실패. */
  iceCandidateErrors: IceCandidateError[];
}
