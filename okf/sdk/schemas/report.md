---
type: schema
title: Report / Envelope
description: SDK가 만들고 서버가 수신하는 데이터 형태 (SDK↔서버 계약)
resource: app/src/lib/analyzer/analyzer.types.ts
tags: [sdk, schema, server]
timestamp: 2026-06-30T00:00:00Z
---

정의는 app `@rtc/peer-analyst`가 export (Report/TrackReport/TransportReport는
`analyzer.types.ts`, ReportEnvelope는 `reporter.types.ts`). 서버는 이를 import해 수신.

# Schema

## ReportEnvelope — POST 본문
- `sentAt: number` — 봉투 전송 시각(epoch ms)
- `sdkVersion: string`
- `reports: Report[]`

## Report — peer 1회 스냅샷
- `peerId: string`, `startedAt: number`, `timestamp: number` (지속시간 = timestamp − startedAt)
- `connection: { connectionState, iceConnectionState, iceGatheringState, signalingState }`
- `transport: TransportReport`
- `recv: TrackReport[]`, `send: TrackReport[]`

## TrackReport — 트랙(ssrc) 단위
- **식별**: `ssrc`, `kind`, `mid`, `rid`, `trackId`, `codec`, `ended`
- **파생(순간)**: `bitrate`, `packetLossRate`, `fractionLost`, `retransmissionRate`, `jitter`, `roundTripTime`, `jitterBufferDelay`, `framesPerSecond`
- **sender 설정**: `active`, `maxBitrate`, `scaleResolutionDownBy`, `maxFramerate`, `targetBitrate`, `qualityLimitationReason`
- **누적 카운터**: `packetsSent`/`packetsReceived`, `framesEncoded`/`framesDecoded`/`framesDropped`, `nackCount`/`pliCount`/`firCount`, `freezeCount`/`totalFreezesDuration`, `fecPacketsReceived`/`fecPacketsSent`
- **영상/오디오**: `frameWidth`×`frameHeight`, `audioLevel`

## TransportReport — 선택된 경로
- `localCandidateType`/`remoteCandidateType`, `protocol`, `relayProtocol`
- `localAddress`/`localPort`, `remoteAddress`/`remotePort`
- `currentRoundTripTime`, `availableOutgoingBitrate`/`availableIncomingBitrate`
- `candidatePairState`, `nominated`, `dtlsState`, `iceState`

> 브라우저별 가용성이 갈려 대부분 optional. ended 트랙은 흐름 파생값이 비워짐.

# 관련
- 생산: [sdk/modules/reporter](../modules/reporter.md) / 가공: [sdk/modules/analyzer](../modules/analyzer.md)
- 수신: [server/apis/collect](../../server/apis/collect.md) · [server/apis/stream](../../server/apis/stream.md)
- 필드 의미(파생): [sdk/metrics/bitrate](../metrics/bitrate.md) 등
