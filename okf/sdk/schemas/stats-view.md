---
type: schema
title: getStats 타입 뷰
description: analyzer가 RTCStatsReport에서 읽는 stat 타입과 주요 필드
resource: app/src/lib/analyzer/analyzer.stats-types.ts
tags: [sdk, schema]
timestamp: 2026-06-30T00:00:00Z
---

`getStats()`는 `Map<string, any>`라, analyzer는 `type`별로 좁힌 "타입 뷰"로 읽는다.
브라우저별 가용성이 갈려 대부분 optional.

# Schema — stat type → 주요 필드 → 쓰임

| stat type                    | 주요 필드                                                                 | 쓰임                  |
| ---------------------------- | ------------------------------------------------------------------------- | --------------------- |
| `inbound-rtp`                | bytesReceived, packetsReceived/Lost, jitter, framesDecoded, nack/pli, retransmitted\*, fec\* | recv 지표             |
| `outbound-rtp`               | bytesSent, packetsSent, retransmitted\*, fec\*, targetBitrate, qualityLimitationReason, nack/pli/fir | send 지표             |
| `remote-inbound-rtp`         | roundTripTime, fractionLost, jitter, packetsLost                          | send 손실·RTT (상대 보고) |
| `remote-outbound-rtp`        | roundTripTime                                                             | recv RTT 근사         |
| `candidate-pair`             | currentRoundTripTime, available\*Bitrate, state, nominated                | transport 경로        |
| `local-`/`remote-candidate`  | candidateType, protocol, address, port, relayProtocol                     | 후보 종류·경로        |
| `transport`                  | dtlsState, iceState, selectedCandidatePairId                              | 전송 상태             |
| `codec`                      | mimeType, clockRate                                                       | 코덱                  |
| `media-source`               | audioLevel, framesPerSecond                                               | 소스                  |

# 관련
- 사용: [sdk/modules/analyzer](../modules/analyzer.md)
- 정규화 결과: [sdk/schemas/report](report.md)
- 스펙 근거: [references/webrtc-stats](../../references/webrtc-stats.md)
