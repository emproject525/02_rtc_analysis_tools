---
type: metric
title: Bitrate
description: 누적 bytes를 직전 폴링과 미분한 현재 전송률(bps)
resource: app/src/lib/analyzer/analyzer.derive.ts
tags: [sdk, metric, derived]
timestamp: 2026-06-30T00:00:00Z
---

# 정의
`bitrate(bps) = (bytes[t] − bytes[t−1]) × 8 / Δt`

- 누적 카운터(`bytesSent`/`bytesReceived`)를 직전 샘플과 미분한 순간값. `×8`은 byte→bit 환산.
- prev 없음 / Δt ≤ 0 / 카운터 리셋(cur < prev) → `undefined` (그래프 공백).
- 단위는 bps(소문자 b = bit). Mbps 표기는 표시 단계에서 `÷ 1e6`.

# 관련
- 계산: [sdk/modules/analyzer](../modules/analyzer.md)
- 집계 규칙: [sdk/decisions/ssrc-lifecycle](../decisions/ssrc-lifecycle.md)
- 진단: [scenarios/bitrate-drop](../../scenarios/bitrate-drop.md)
