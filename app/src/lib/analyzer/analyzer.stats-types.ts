/**
 * getStats()가 돌려주는 RTCStatsReport는 `Map<string, any>`라 값이 `any`다.
 * 분석에 쓰는 레코드만 type별로 좁힌 "타입 뷰" — docs `01_stats_dashboard.md`
 * B 섹션 기준. 브라우저별 가용성이 갈리므로 베이스 외 모든 필드는 optional.
 */

/** 모든 getStats 레코드 공통 필드. */
interface StatsBase {
  id: string;
  timestamp: number;
}

/** `transport` — 연결당 1개(BUNDLE), peer 헤더용. */
export interface TransportStats extends StatsBase {
  type: "transport";
  dtlsState?: RTCDtlsTransportState;
  iceState?: RTCIceTransportState;
  selectedCandidatePairId?: string;
  bytesSent?: number;
  bytesReceived?: number;
}

/** `candidate-pair` — 선택된 1개(`transport.selectedCandidatePairId`). */
export interface CandidatePairStats extends StatsBase {
  type: "candidate-pair";
  state?: string;
  nominated?: boolean;
  currentRoundTripTime?: number;
  availableOutgoingBitrate?: number;
  availableIncomingBitrate?: number;
  localCandidateId?: string;
  remoteCandidateId?: string;
}

/** `local-candidate` / `remote-candidate`. */
export interface IceCandidateStats extends StatsBase {
  type: "local-candidate" | "remote-candidate";
  candidateType?: RTCIceCandidateType;
  protocol?: string;
  address?: string | null;
  port?: number | null;
  relayProtocol?: string;
}

/** `inbound-rtp` — recv 트랙마다. */
export interface InboundRtpStats extends StatsBase {
  type: "inbound-rtp";
  ssrc: number;
  mid?: string;
  trackIdentifier?: string;
  kind: "audio" | "video";
  bytesReceived?: number;
  packetsReceived?: number;
  packetsLost?: number;
  // 재전송/FEC는 RTP NACK/RTX·FEC로 받은 누적분 (UDP가 아니라 RTP 레벨 복구).
  retransmittedPacketsReceived?: number;
  retransmittedBytesReceived?: number;
  fecPacketsReceived?: number;
  fecPacketsDiscarded?: number;
  jitter?: number;
  framesPerSecond?: number;
  frameWidth?: number;
  frameHeight?: number;
  framesDecoded?: number;
  framesDropped?: number;
  freezeCount?: number;
  totalFreezesDuration?: number;
  nackCount?: number;
  pliCount?: number;
  firCount?: number;
  jitterBufferDelay?: number;
  jitterBufferEmittedCount?: number;
  audioLevel?: number;
  totalAudioEnergy?: number;
  codecId?: string;
}

/** `outbound-rtp` — send 트랙마다(simulcast면 rid별로 여러 개). */
export interface OutboundRtpStats extends StatsBase {
  type: "outbound-rtp";
  ssrc: number;
  mid?: string;
  rid?: string;
  kind: "audio" | "video";
  bytesSent?: number;
  packetsSent?: number;
  // 재전송/FEC 송신 누적. retransmittedBytesSent는 bytesSent에 이미 포함된 부분집합.
  retransmittedPacketsSent?: number;
  retransmittedBytesSent?: number;
  fecPacketsSent?: number;
  framesPerSecond?: number;
  frameWidth?: number;
  frameHeight?: number;
  framesEncoded?: number;
  nackCount?: number;
  pliCount?: number;
  firCount?: number;
  targetBitrate?: number;
  qualityLimitationReason?: string;
  qualityLimitationDurations?: Record<string, number>;
  codecId?: string;
  mediaSourceId?: string;
}

/** `remote-inbound-rtp` — 내 send를 상대가 받은 리포트(=send RTT/loss 출처). */
export interface RemoteInboundRtpStats extends StatsBase {
  type: "remote-inbound-rtp";
  ssrc: number;
  roundTripTime?: number;
  fractionLost?: number;
  packetsLost?: number;
  jitter?: number;
}

/** `remote-outbound-rtp` — 내 recv에 대한 상대 송신 리포트(=recv RTT 추정). */
export interface RemoteOutboundRtpStats extends StatsBase {
  type: "remote-outbound-rtp";
  ssrc: number;
  remoteTimestamp?: number;
  roundTripTime?: number;
}

/** `codec`. */
export interface CodecStats extends StatsBase {
  type: "codec";
  mimeType?: string;
  clockRate?: number;
  payloadType?: number;
  channels?: number;
  sdpFmtpLine?: string;
}

/** `media-source` — outbound 원본 소스(선택). */
export interface MediaSourceStats extends StatsBase {
  type: "media-source";
  audioLevel?: number;
  totalAudioEnergy?: number;
  width?: number;
  height?: number;
  framesPerSecond?: number;
}

export type AnyStats =
  | TransportStats
  | CandidatePairStats
  | IceCandidateStats
  | InboundRtpStats
  | OutboundRtpStats
  | RemoteInboundRtpStats
  | RemoteOutboundRtpStats
  | CodecStats
  | MediaSourceStats;

/** report에서 특정 type 레코드만 뽑아 좁힌 타입으로 돌려준다. */
export const statsByType = <T extends AnyStats>(
  report: RTCStatsReport,
  type: T["type"],
): T[] => {
  const out: T[] = [];
  report.forEach((stat) => {
    if (stat.type === type) out.push(stat as T);
  });
  return out;
};

/** id로 레코드 1개를 좁힌 타입으로 가져온다(`*Id` 조인용). */
export const statById = <T extends AnyStats>(
  report: RTCStatsReport,
  id: string | undefined,
): T | undefined =>
  id == null ? undefined : (report.get(id) as T | undefined);

/** ssrc → 레코드 인덱스 (직전 샘플 미분 매칭용). */
export const indexBySsrc = <T extends { ssrc: number }>(
  records: T[],
): Map<number, T> => new Map(records.map((record) => [record.ssrc, record]));
