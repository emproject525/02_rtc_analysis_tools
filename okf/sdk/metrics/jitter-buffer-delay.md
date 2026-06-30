---
type: metric
title: Jitter Buffer Delay (평균)
description: 수신 버퍼 평균 지연(초) — 누적 지연을 emit 수로 나눈 구간 평균
resource: app/src/lib/analyzer/analyzer.derive.ts
tags: [sdk, metric, derived, recv]
timestamp: 2026-06-30T00:00:00Z
---

# 정의
`avg = ΔjitterBufferDelay / ΔjitterBufferEmittedCount`

- 누적 총지연을 같은 구간 emit 수로 나눈 구간 평균(초). recv 전용.
- emit 증가 없음 / 리셋 → `undefined`.

# 관련
- 계산: [sdk/modules/analyzer](../modules/analyzer.md)
