---
type: schema
title: RawSample
description: collector가 한 폴링에서 모은 가공 전 원본 묶음
resource: app/src/lib/collector/collector.types.ts
tags: [sdk, schema]
timestamp: 2026-06-30T00:00:00Z
---

`collector.collect()`가 돌려주는 1회 폴링 원본. [analyzer](../modules/analyzer.md)가 이를 [Report](report.md)로 가공한다.

# Schema

| 필드                 | 타입                       | 설명                                       |
| -------------------- | -------------------------- | ------------------------------------------ |
| `timestamp`          | `number`                   | `performance.now()` 시각 (미분 Δt 기준)    |
| `state`              | `ConnectionStateSnapshot`  | 그 시점 연결 상태 4종                      |
| `stats`              | `RTCStatsReport`           | `getStats()` 원본 (Map, 가공 안 함)        |
| `transceivers`       | `TransceiverSnapshot[]`    | mid/direction/track id/sender encodings    |
| `transitions`        | `StateTransition[]`        | 직전 collect 이후 쌓인 상태 전이 (drain)   |
| `iceCandidateErrors` | `IceCandidateError[]`      | 직전 collect 이후 `icecandidateerror`      |

# 관련
- 생산: [sdk/modules/collector](../modules/collector.md) / 소비: [sdk/modules/analyzer](../modules/analyzer.md)
- 결과물: [sdk/schemas/report](report.md)
