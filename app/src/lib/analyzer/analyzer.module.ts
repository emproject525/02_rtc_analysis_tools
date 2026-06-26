import type { RawSample, TransceiverSnapshot } from "../collector";
import type { Report, TrackReport, TransportReport } from "./analyzer.types";
import {
  type CandidatePairStats,
  type CodecStats,
  type IceCandidateStats,
  type InboundRtpStats,
  type OutboundRtpStats,
  type RemoteInboundRtpStats,
  type RemoteOutboundRtpStats,
  type TransportStats,
  indexBySsrc,
  statById,
  statsByType,
} from "./analyzer.stats-types";
import {
  avgJitterBufferDelay,
  bitrate,
  packetLossRate,
} from "./analyzer.derive";

/** mid → transceiver 스냅 (outbound trackId / direction 해결용). */
const indexTransceiversByMid = (
  transceivers: TransceiverSnapshot[],
): Map<string, TransceiverSnapshot> => {
  const map = new Map<string, TransceiverSnapshot>();
  for (const transceiver of transceivers) {
    if (transceiver.mid != null) map.set(transceiver.mid, transceiver);
  }
  return map;
};

/** transport + 선택된 candidate-pair + 양쪽 candidate를 묶어 경로 정보로. */
const buildTransport = (stats: RTCStatsReport): TransportReport => {
  const transports = statsByType<TransportStats>(stats, "transport");
  // BUNDLE이면 보통 1개. selectedCandidatePairId가 있는 걸 우선.
  const transport =
    transports.find((t) => t.selectedCandidatePairId != null) ?? transports[0];
  if (!transport) return {};

  const pair = statById<CandidatePairStats>(
    stats,
    transport.selectedCandidatePairId,
  );
  const local = statById<IceCandidateStats>(stats, pair?.localCandidateId);
  const remote = statById<IceCandidateStats>(stats, pair?.remoteCandidateId);

  return {
    localCandidateType: local?.candidateType,
    remoteCandidateType: remote?.candidateType,
    protocol: local?.protocol,
    relayProtocol: local?.relayProtocol,
    localAddress: local?.address ?? undefined,
    localPort: local?.port ?? undefined,
    remoteAddress: remote?.address ?? undefined,
    remotePort: remote?.port ?? undefined,
    currentRoundTripTime: pair?.currentRoundTripTime,
    availableOutgoingBitrate: pair?.availableOutgoingBitrate,
    availableIncomingBitrate: pair?.availableIncomingBitrate,
    candidatePairState: pair?.state,
    nominated: pair?.nominated,
    dtlsState: transport.dtlsState,
    iceState: transport.iceState,
  };
};

/** recv 트랙: inbound-rtp + codec + transceiver + remote-outbound-rtp(RTT). */
const buildRecv = (
  raw: RawSample,
  prev: RawSample | null,
  dtSec: number,
  txByMid: Map<string, TransceiverSnapshot>,
): TrackReport[] => {
  const prevBySsrc = indexBySsrc(
    prev ? statsByType<InboundRtpStats>(prev.stats, "inbound-rtp") : [],
  );
  const remoteOutBySsrc = indexBySsrc(
    statsByType<RemoteOutboundRtpStats>(raw.stats, "remote-outbound-rtp"),
  );

  return statsByType<InboundRtpStats>(raw.stats, "inbound-rtp").map((cur) => {
    const before = prevBySsrc.get(cur.ssrc);
    const tx = cur.mid != null ? txByMid.get(cur.mid) : undefined;
    const remoteOut = remoteOutBySsrc.get(cur.ssrc);
    const codec = statById<CodecStats>(raw.stats, cur.codecId)?.mimeType;

    return {
      direction: "inbound",
      kind: cur.kind,
      ssrc: cur.ssrc,
      mid: cur.mid ?? null,
      trackId: cur.trackIdentifier ?? tx?.receiverTrackId ?? null,
      transceiverDirection: tx?.currentDirection ?? undefined,
      codec,
      bitrate: bitrate(cur.bytesReceived, before?.bytesReceived, dtSec),
      packetLossRate: packetLossRate(
        cur.packetsLost,
        before?.packetsLost,
        cur.packetsReceived,
        before?.packetsReceived,
      ),
      packetsReceived: cur.packetsReceived,
      jitter: cur.jitter,
      roundTripTime: remoteOut?.roundTripTime,
      jitterBufferDelay: avgJitterBufferDelay(
        cur.jitterBufferDelay,
        before?.jitterBufferDelay,
        cur.jitterBufferEmittedCount,
        before?.jitterBufferEmittedCount,
      ),
      frameWidth: cur.frameWidth,
      frameHeight: cur.frameHeight,
      framesPerSecond: cur.framesPerSecond,
      framesDecoded: cur.framesDecoded,
      framesDropped: cur.framesDropped,
      nackCount: cur.nackCount,
      pliCount: cur.pliCount,
      firCount: cur.firCount,
      freezeCount: cur.freezeCount,
      totalFreezesDuration: cur.totalFreezesDuration,
      audioLevel: cur.audioLevel,
    };
  });
};

/** send 트랙: outbound-rtp + codec + transceiver + remote-inbound-rtp(RTT/loss). */
const buildSend = (
  raw: RawSample,
  prev: RawSample | null,
  dtSec: number,
  txByMid: Map<string, TransceiverSnapshot>,
): TrackReport[] => {
  const prevBySsrc = indexBySsrc(
    prev ? statsByType<OutboundRtpStats>(prev.stats, "outbound-rtp") : [],
  );
  const remoteInBySsrc = indexBySsrc(
    statsByType<RemoteInboundRtpStats>(raw.stats, "remote-inbound-rtp"),
  );
  const prevRemoteInBySsrc = indexBySsrc(
    prev
      ? statsByType<RemoteInboundRtpStats>(prev.stats, "remote-inbound-rtp")
      : [],
  );

  return statsByType<OutboundRtpStats>(raw.stats, "outbound-rtp").map((cur) => {
    const before = prevBySsrc.get(cur.ssrc);
    const tx = cur.mid != null ? txByMid.get(cur.mid) : undefined;
    const remoteIn = remoteInBySsrc.get(cur.ssrc);
    const remoteInBefore = prevRemoteInBySsrc.get(cur.ssrc);
    const codec = statById<CodecStats>(raw.stats, cur.codecId)?.mimeType;

    return {
      direction: "outbound",
      kind: cur.kind,
      ssrc: cur.ssrc,
      mid: cur.mid ?? null,
      rid: cur.rid,
      trackId: tx?.senderTrackId ?? null,
      transceiverDirection: tx?.currentDirection ?? undefined,
      codec,
      bitrate: bitrate(cur.bytesSent, before?.bytesSent, dtSec),
      // 손실은 상대가 보고하는 remote-inbound-rtp 기준 (우리 send를 상대가 받은 결과).
      packetLossRate: packetLossRate(
        remoteIn?.packetsLost,
        remoteInBefore?.packetsLost,
        cur.packetsSent,
        before?.packetsSent,
      ),
      fractionLost: remoteIn?.fractionLost,
      packetsSent: cur.packetsSent,
      jitter: remoteIn?.jitter,
      roundTripTime: remoteIn?.roundTripTime,
      frameWidth: cur.frameWidth,
      frameHeight: cur.frameHeight,
      framesPerSecond: cur.framesPerSecond,
      framesEncoded: cur.framesEncoded,
      nackCount: cur.nackCount,
      pliCount: cur.pliCount,
      firCount: cur.firCount,
      targetBitrate: cur.targetBitrate,
      qualityLimitationReason: cur.qualityLimitationReason,
    };
  });
};

/**
 * raw 샘플을 정규화된 Report로 가공한다.
 * bitrate/손실률 등은 누적값 미분이라 직전 샘플을 내부에 보관한다.
 * (peer마다 Analyzer 1개 → 미분 상태 격리)
 *
 * 미분은 ssrc 단위로 prev와 매칭한다(우리 규칙). 새 ssrc/카운터 리셋이면
 * 해당 파생값만 undefined로 빠지고 나머지 현재값은 그대로 채운다.
 */
export class Analyzer {
  private _prev: RawSample | null = null;

  analyze = (raw: RawSample, peerId: string, startedAt: number): Report => {
    const prev = this._prev;
    this._prev = raw;

    const dtSec = prev ? (raw.timestamp - prev.timestamp) / 1000 : 0;
    const txByMid = indexTransceiversByMid(raw.transceivers);

    return {
      peerId,
      startedAt,
      timestamp: Date.now(),
      connection: raw.state,
      transport: buildTransport(raw.stats),
      recv: buildRecv(raw, prev, dtSec, txByMid),
      send: buildSend(raw, prev, dtSec, txByMid),
    };
  };

  /** 직전 샘플 초기화 (의도적으로 미분 기준을 끊을 때). */
  reset = () => {
    this._prev = null;
  };
}
