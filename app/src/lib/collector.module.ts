import type {
  ConnectionStateSnapshot,
  RawSample,
  TransceiverSnapshot,
} from "./collector.types";

const STATE_EVENTS = [
  "connectionstatechange",
  "iceconnectionstatechange",
  "icegatheringstatechange",
  "signalingstatechange",
] as const;

/**
 * peer에서 읽는 모든 데이터를 한 곳에서 담당한다.
 * - 연결 상태 이벤트(push)를 구독해 최신 상태를 캐싱
 * - collect() 호출 시 getStats(pull) + 상태 + transceiver 스냅을 묶어 RawSample 반환
 */
export class Collector {
  private _state: ConnectionStateSnapshot;

  constructor(private readonly _peer: RTCPeerConnection) {
    this._state = this._readState();
    this._subscribe();
  }

  /** 폴링 1회 — 가공 전 원본 묶음을 만든다. */
  collect = async (): Promise<RawSample> => {
    const stats = await this._peer.getStats();
    return {
      timestamp: performance.now(),
      state: this._state,
      stats,
      transceivers: this._snapshotTransceivers(),
    };
  };

  /** 이벤트 리스너 해제. unobserve 시 호출. */
  dispose = () => {
    for (const event of STATE_EVENTS) {
      this._peer.removeEventListener(event, this._onStateChange);
    }
  };

  private _subscribe = () => {
    for (const event of STATE_EVENTS) {
      this._peer.addEventListener(event, this._onStateChange);
    }
  };

  private _onStateChange = () => {
    this._state = this._readState();
  };

  private _readState = (): ConnectionStateSnapshot => ({
    connectionState: this._peer.connectionState,
    iceConnectionState: this._peer.iceConnectionState,
    iceGatheringState: this._peer.iceGatheringState,
    signalingState: this._peer.signalingState,
  });

  private _snapshotTransceivers = (): TransceiverSnapshot[] =>
    this._peer.getTransceivers().map((transceiver) => ({
      mid: transceiver.mid,
      direction: transceiver.direction,
      currentDirection: transceiver.currentDirection,
      senderTrackId: transceiver.sender.track?.id ?? null,
      receiverTrackId: transceiver.receiver.track?.id ?? null,
    }));
}
