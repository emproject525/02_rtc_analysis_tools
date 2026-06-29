import { describe, expect, it } from "vitest";
import { Analyzer } from "./analyzer.module";
import type { RawSample, TransceiverSnapshot } from "../collector";

const TRANSCEIVERS: TransceiverSnapshot[] = [
  {
    mid: "0",
    direction: "recvonly",
    currentDirection: "recvonly",
    senderTrackId: null,
    receiverTrackId: "recv-track",
    senderEncodings: [],
  },
  {
    mid: "1",
    direction: "sendonly",
    currentDirection: "sendonly",
    senderTrackId: "send-track",
    receiverTrackId: null,
    senderEncodings: [{ rid: "hi", active: true, maxBitrate: 2_000_000 }],
  },
];

// id로 키를 잡은 가짜 RTCStatsReport (Map 기반).
const report = (records: Array<Record<string, unknown>>): RTCStatsReport =>
  new Map(records.map((r) => [r.id as string, r])) as unknown as RTCStatsReport;

const sample = (timestamp: number, stats: RTCStatsReport): RawSample => ({
  timestamp,
  state: {
    connectionState: "connected",
    iceConnectionState: "connected",
    iceGatheringState: "complete",
    signalingState: "stable",
  },
  stats,
  transceivers: TRANSCEIVERS,
  transitions: [],
  iceCandidateErrors: [],
});

// 공통 경로/코덱 레코드 (미분 무관).
const pathRecords = () => [
  {
    id: "T1",
    type: "transport",
    selectedCandidatePairId: "P1",
    dtlsState: "connected",
  },
  {
    id: "P1",
    type: "candidate-pair",
    state: "succeeded",
    nominated: true,
    currentRoundTripTime: 0.03,
    availableOutgoingBitrate: 1_500_000,
    localCandidateId: "L1",
    remoteCandidateId: "R1",
  },
  { id: "L1", type: "local-candidate", candidateType: "host", protocol: "udp" },
  {
    id: "R1",
    type: "remote-candidate",
    candidateType: "srflx",
    protocol: "udp",
  },
  { id: "C1", type: "codec", mimeType: "video/VP8", clockRate: 90000 },
];

const inbound = (bytes: number, pkts: number, lost: number) => ({
  id: "IT1",
  type: "inbound-rtp",
  ssrc: 1111,
  mid: "0",
  trackIdentifier: "recv-track",
  kind: "video",
  bytesReceived: bytes,
  packetsReceived: pkts,
  packetsLost: lost,
  jitter: 0.01,
  framesPerSecond: 30,
  frameWidth: 1280,
  frameHeight: 720,
  jitterBufferDelay: 1.0 + (pkts - 100) * 0.002,
  jitterBufferEmittedCount: pkts,
  codecId: "C1",
});

const outbound = (bytes: number, pkts: number) => ({
  id: "OT1",
  type: "outbound-rtp",
  ssrc: 2222,
  mid: "1",
  rid: "hi",
  kind: "video",
  bytesSent: bytes,
  packetsSent: pkts,
  framesPerSecond: 30,
  targetBitrate: 1_200_000,
  qualityLimitationReason: "none",
  codecId: "C1",
});

const remoteInbound = (lost: number) => ({
  id: "RI1",
  type: "remote-inbound-rtp",
  ssrc: 2222,
  roundTripTime: 0.08,
  fractionLost: 0.02,
  packetsLost: lost,
  jitter: 0.005,
});

const remoteOutbound = () => ({
  id: "RO1",
  type: "remote-outbound-rtp",
  ssrc: 1111,
  roundTripTime: 0.05,
});

describe("Analyzer.analyze", () => {
  it("첫 샘플은 미분값(bitrate) 없이 현재값/경로만 채운다", () => {
    const analyzer = new Analyzer();
    const r = analyzer.analyze(
      sample(
        1000,
        report([
          ...pathRecords(),
          inbound(1000, 100, 5),
          outbound(2000, 50),
          remoteInbound(1),
          remoteOutbound(),
        ]),
      ),
      "peer-1",
      500,
    );

    expect(r.peerId).toBe("peer-1");
    expect(r.startedAt).toBe(500);
    expect(r.recv).toHaveLength(1);
    expect(r.recv[0].bitrate).toBeUndefined(); // prev 없음
    expect(r.recv[0].jitter).toBe(0.01); // 현재값은 채워짐
    expect(r.transport.currentRoundTripTime).toBe(0.03);
  });

  it("두 번째 샘플은 ssrc로 prev와 미분해 파생값을 채운다", () => {
    const analyzer = new Analyzer();
    analyzer.analyze(
      sample(
        1000,
        report([
          ...pathRecords(),
          inbound(1000, 100, 5),
          outbound(2000, 50),
          remoteInbound(1),
          remoteOutbound(),
        ]),
      ),
      "peer-1",
      500,
    );
    // Δt = 2s
    const r = analyzer.analyze(
      sample(
        3000,
        report([
          ...pathRecords(),
          inbound(1_001_000, 200, 7),
          outbound(2_252_000, 150),
          remoteInbound(3),
          remoteOutbound(),
        ]),
      ),
      "peer-1",
      500,
    );

    const recv = r.recv[0];
    expect(recv.ssrc).toBe(1111);
    expect(recv.mid).toBe("0");
    expect(recv.trackId).toBe("recv-track");
    expect(recv.codec).toBe("video/VP8");
    expect(recv.bitrate).toBe(4_000_000); // (1_001_000-1000)*8/2
    expect(recv.packetLossRate).toBeCloseTo(1.9607, 3); // Δlost2 / (Δlost2+Δpkts100)
    expect(recv.roundTripTime).toBe(0.05); // remote-outbound-rtp
    expect(recv.jitterBufferDelay).toBeCloseTo(0.002, 6);

    const send = r.send[0];
    expect(send.ssrc).toBe(2222);
    expect(send.rid).toBe("hi");
    expect(send.trackId).toBe("send-track"); // transceiver에서 해결
    expect(send.bitrate).toBe(9_000_000); // (2_250_000-2000)*8/2
    expect(send.fractionLost).toBe(0.02);
    expect(send.roundTripTime).toBe(0.08);
    expect(send.targetBitrate).toBe(1_200_000);
    // rid "hi"로 transceiver encoding 설정이 매칭돼 Report에 실린다.
    expect(send.active).toBe(true);
    expect(send.maxBitrate).toBe(2_000_000);
  });

  it("경로(transport)를 candidate-pair/candidate로 조인한다", () => {
    const analyzer = new Analyzer();
    const r = analyzer.analyze(
      sample(1000, report([...pathRecords(), inbound(1000, 100, 5)])),
      "peer-1",
      0,
    );
    expect(r.transport.localCandidateType).toBe("host");
    expect(r.transport.remoteCandidateType).toBe("srflx");
    expect(r.transport.protocol).toBe("udp");
    expect(r.transport.dtlsState).toBe("connected");
    expect(r.transport.candidatePairState).toBe("succeeded");
    expect(r.transport.availableOutgoingBitrate).toBe(1_500_000);
  });

  it("재전송 바이트를 전체 바이트와 미분해 재전송률(%)을 채운다", () => {
    const analyzer = new Analyzer();
    analyzer.analyze(
      sample(
        1000,
        report([
          ...pathRecords(),
          { ...outbound(10_000, 100), retransmittedBytesSent: 100 },
        ]),
      ),
      "peer-1",
      0,
    );
    // Δt=2s, 전체 +2000 중 재전송 +200 → 10%
    const r = analyzer.analyze(
      sample(
        3000,
        report([
          ...pathRecords(),
          {
            ...outbound(12_000, 200),
            retransmittedBytesSent: 300,
            fecPacketsSent: 4,
          },
        ]),
      ),
      "peer-1",
      0,
    );
    expect(r.send[0].retransmissionRate).toBe(10);
    expect(r.send[0].fecPacketsSent).toBe(4);
  });

  it("사라진 ssrc는 ended:true로 목록에 남고, 살아있으면 ended:false", () => {
    const analyzer = new Analyzer();
    // 1차: send 트랙(ssrc 2222) 존재
    analyzer.analyze(
      sample(1000, report([...pathRecords(), outbound(2000, 50)])),
      "peer-1",
      0,
    );
    // 2차: outbound 사라짐(트랙 종료) → 목록에 ended로 잔존
    const r = analyzer.analyze(
      sample(3000, report([...pathRecords(), inbound(1000, 100, 5)])),
      "peer-1",
      0,
    );
    expect(r.send).toHaveLength(1);
    expect(r.send[0].ssrc).toBe(2222);
    expect(r.send[0].ended).toBe(true);
    expect(r.recv[0].ended).toBe(false); // 살아있는 트랙
  });

  it("ended 트랙은 직전 흐름 파생값(bitrate 등)을 비운다", () => {
    const analyzer = new Analyzer();
    analyzer.analyze(
      sample(1000, report([...pathRecords(), outbound(2000, 50)])),
      "peer-1",
      0,
    );
    // 2틱: 살아있어 bitrate가 계산됨
    const live = analyzer.analyze(
      sample(3000, report([...pathRecords(), outbound(2_252_000, 150)])),
      "peer-1",
      0,
    );
    expect(live.send[0].bitrate).toBe(9_000_000);
    // 3틱: 사라짐 → ended, 흐름 파생값은 비워짐
    const ended = analyzer.analyze(
      sample(5000, report([...pathRecords(), inbound(1000, 100, 5)])),
      "peer-1",
      0,
    );
    expect(ended.send[0].ended).toBe(true);
    expect(ended.send[0].bitrate).toBeUndefined();
  });

  it("reset 후에는 ended 잔존 항목이 비워진다", () => {
    const analyzer = new Analyzer();
    analyzer.analyze(
      sample(1000, report([...pathRecords(), outbound(2000, 50)])),
      "peer-1",
      0,
    );
    analyzer.reset();
    const r = analyzer.analyze(
      sample(3000, report([...pathRecords(), inbound(1000, 100, 5)])),
      "peer-1",
      0,
    );
    expect(r.send).toHaveLength(0); // 레지스트리 초기화로 ended 잔존 없음
  });

  it("카운터가 줄면(리셋) bitrate를 미분하지 않는다", () => {
    const analyzer = new Analyzer();
    analyzer.analyze(
      sample(1000, report([...pathRecords(), inbound(1_000_000, 100, 5)])),
      "peer-1",
      0,
    );
    const r = analyzer.analyze(
      sample(3000, report([...pathRecords(), inbound(500, 10, 0)])), // 리셋
      "peer-1",
      0,
    );
    expect(r.recv[0].bitrate).toBeUndefined();
    expect(r.recv[0].packetLossRate).toBeUndefined();
  });
});
