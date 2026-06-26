import type {
  ConnectionStateSnapshot,
  IceCandidateError,
  RawSample,
  StateTransition,
  TransceiverSnapshot,
} from "./collector.types";

const STATE_EVENTS = [
  "connectionstatechange",
  "iceconnectionstatechange",
  "icegatheringstatechange",
  "signalingstatechange",
] as const;

/** ConnectionStateSnapshot의 키 — 전이 감지 시 필드별로 순회한다. */
const STATE_KINDS = [
  "connectionState",
  "iceConnectionState",
  "iceGatheringState",
  "signalingState",
] as const;

/**
 * peer에서 읽는 모든 데이터를 한 곳에서 담당한다.
 * - 연결 상태 이벤트(push)를 구독해 최신 상태를 캐싱
 * - collect() 호출 시 getStats(pull) + 상태 + transceiver 스냅을 묶어 RawSample 반환
 */
export class Collector {
  private _state: ConnectionStateSnapshot;
  /** 직전 collect 이후 쌓인 상태 전이 (다음 collect에서 drain). */
  private _transitions: StateTransition[] = [];
  /** 직전 collect 이후 발생한 icecandidateerror. */
  private _iceCandidateErrors: IceCandidateError[] = [];

  constructor(private readonly _peer: RTCPeerConnection) {
    this._state = this._readState();
    this._subscribe();
  }

  /** 폴링 1회 — 가공 전 원본 묶음을 만들고 버퍼를 비운다. */
  collect = async (): Promise<RawSample> => {
    const stats = await this._peer.getStats();
    const sample: RawSample = {
      timestamp: performance.now(),
      state: this._state,
      stats,
      transceivers: this._snapshotTransceivers(),
      transitions: this._transitions,
      iceCandidateErrors: this._iceCandidateErrors,
    };
    // drain — 실어 보낸 전이/에러는 다음 폴링에서 다시 보내지 않도록 비운다.
    this._transitions = [];
    this._iceCandidateErrors = [];
    return sample;
  };

  /** 이벤트 리스너 해제. unobserve 시 호출. */
  dispose = () => {
    for (const event of STATE_EVENTS) {
      this._peer.removeEventListener(event, this._onStateChange);
    }
    this._peer.removeEventListener(
      "icecandidateerror",
      this._onIceCandidateError,
    );
  };

  private _subscribe = () => {
    for (const event of STATE_EVENTS) {
      this._peer.addEventListener(event, this._onStateChange);
    }
    this._peer.addEventListener("icecandidateerror", this._onIceCandidateError);
  };

  private _onStateChange = () => {
    const next = this._readState();
    const timestamp = performance.now();
    // 바뀐 필드만 전이로 버퍼에 누적 → 다음 collect()에서 함께 비워 보낸다.
    // (state를 그냥 덮어쓰면 폴링 간격 안의 중간 전이가 사라지므로)
    for (const kind of STATE_KINDS) {
      if (next[kind] !== this._state[kind]) {
        this._transitions.push({
          timestamp,
          kind,
          from: this._state[kind],
          to: next[kind],
        });
      }
    }
    this._state = next;
  };

  private _onIceCandidateError = (event: RTCPeerConnectionIceErrorEvent) => {
    // 순간 이벤트 — 폴링으론 못 잡으므로 발생 즉시 버퍼에 쌓는다.
    this._iceCandidateErrors.push({
      timestamp: performance.now(),
      errorCode: event.errorCode,
      errorText: event.errorText,
      url: event.url,
      address: event.address,
      port: event.port,
    });
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
