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

`?`는 optional (브라우저별 가용성이 갈려 대부분 optional).

# Schema

## ReportEnvelope — POST 본문

| 필드         | 타입       | 설명                     |
| ------------ | ---------- | ------------------------ |
| `sentAt`     | `number`   | 봉투 전송 시각 (epoch ms) |
| `sdkVersion` | `string`   | SDK 버전 (package.json)  |
| `reports`    | `Report[]` | 이 배치의 Report들       |

## Report — peer 1회 스냅샷

| 필드         | 타입               | 설명                              |
| ------------ | ------------------ | --------------------------------- |
| `peerId`     | `string`           | peer 식별자 (지정 또는 자동 UUID) |
| `startedAt`  | `number`           | observe 시작 시각 (epoch ms)      |
| `timestamp`  | `number`           | 이 Report 생성 시각 (epoch ms)    |
| `connection` | `ConnectionState`  | 연결 상태 4종 (아래)              |
| `transport`  | `TransportReport`  | 선택된 경로 (아래)                |
| `recv`       | `TrackReport[]`    | 수신 트랙들                       |
| `send`       | `TrackReport[]`    | 송신 트랙들                       |

지속시간 = `timestamp − startedAt`.

## ConnectionState

| 필드                 | 타입                     | 설명                          |
| -------------------- | ------------------------ | ----------------------------- |
| `connectionState`    | `RTCPeerConnectionState` | connected / failed / closed … |
| `iceConnectionState` | `RTCIceConnectionState`  | -                             |
| `iceGatheringState`  | `RTCIceGatheringState`   | -                             |
| `signalingState`     | `RTCSignalingState`      | -                             |

## TrackReport — 트랙(ssrc) 단위

| 분류    | 필드                                                          | 타입                         | 설명                       |
| ------- | ------------------------------------------------------------- | ---------------------------- | -------------------------- |
| 식별    | `direction`                                                   | `"inbound"` \| `"outbound"`  | rtp 방향                   |
| 식별    | `kind`                                                        | `"audio"` \| `"video"`       | -                          |
| 식별    | `ssrc`                                                        | `number`                     | RTP 스트림 식별자          |
| 식별    | `mid`                                                         | `string` \| `null`           | transceiver mid            |
| 식별    | `rid?`                                                        | `string`                     | simulcast 레이어 (outbound) |
| 식별    | `trackId?`                                                    | `string` \| `null`           | 그 시점의 track.id         |
| 식별    | `codec?`                                                      | `string`                     | mimeType (예: video/VP8)   |
| 식별    | `ended?`                                                      | `boolean`                    | ssrc 사라짐 표시           |
| 파생    | `bitrate?`                                                    | `number`                     | bps                        |
| 파생    | `packetLossRate?`                                             | `number`                     | %                          |
| 파생    | `fractionLost?`                                               | `number`                     | 0~1 (최근 구간)            |
| 파생    | `retransmissionRate?`                                         | `number`                     | %                          |
| 파생    | `jitter?` / `roundTripTime?` / `jitterBufferDelay?`           | `number`                     | 초                         |
| 파생    | `framesPerSecond?`                                            | `number`                     | -                          |
| sender  | `active?`                                                     | `boolean`                    | 레이어 활성                |
| sender  | `maxBitrate?` / `targetBitrate?`                              | `number`                     | bps (상한 / 인코더 목표)   |
| sender  | `scaleResolutionDownBy?` / `maxFramerate?`                    | `number`                     | 해상도 축소 배율 / 상한 fps |
| sender  | `qualityLimitationReason?`                                    | `string`                     | cpu / bandwidth / none     |
| 누적    | `packetsReceived?` / `packetsSent?`                           | `number`                     | 누적 패킷                  |
| 누적    | `framesEncoded?` / `framesDecoded?` / `framesDropped?`        | `number`                     | 누적 프레임                |
| 누적    | `nackCount?` / `pliCount?` / `firCount?`                      | `number`                     | 재전송·키프레임 요청       |
| 누적    | `freezeCount?` / `totalFreezesDuration?`                      | `number`                     | 프리징 횟수 / 누적 초      |
| 누적    | `fecPacketsReceived?` / `fecPacketsSent?`                     | `number`                     | FEC 패킷                   |
| 영상    | `frameWidth?` × `frameHeight?`                                | `number`                     | 해상도                     |
| 오디오  | `audioLevel?`                                                 | `number`                     | 0~1                        |

> ended 트랙은 흐름 파생값(bitrate 등)이 비워지고 누적/정적값만 남는다.

## TransportReport — 선택된 경로

| 필드                                                | 타입                       | 설명                  |
| --------------------------------------------------- | -------------------------- | --------------------- |
| `localCandidateType` / `remoteCandidateType`        | `RTCIceCandidateType`      | host / srflx / relay … |
| `protocol`                                          | `string`                   | udp / tcp             |
| `relayProtocol?`                                    | `string`                   | relay일 때 TURN 전송   |
| `localAddress?` / `localPort?`                      | `string` / `number`        | 로컬 후보             |
| `remoteAddress?` / `remotePort?`                    | `string` / `number`        | 원격 후보             |
| `currentRoundTripTime?`                             | `number`                   | connection RTT (초)   |
| `availableOutgoingBitrate?` / `availableIncomingBitrate?` | `number`             | bps                   |
| `candidatePairState?`                               | `string`                   | succeeded 등          |
| `nominated?`                                        | `boolean`                  | 선택된 쌍             |
| `dtlsState?`                                        | `RTCDtlsTransportState`    | -                     |
| `iceState?`                                         | `RTCIceTransportState`     | -                     |

# 관련

- 생산: [sdk/modules/reporter](../modules/reporter.md) / 가공: [sdk/modules/analyzer](../modules/analyzer.md)
- 수신: [server/apis/collect](../../server/apis/collect.md) · [server/apis/stream](../../server/apis/stream.md)
- 필드 의미(파생): [sdk/metrics/bitrate](../metrics/bitrate.md) 등
