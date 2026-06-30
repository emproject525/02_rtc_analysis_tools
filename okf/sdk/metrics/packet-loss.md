---
type: metric
title: Packet Loss Rate
description: 구간 손실 패킷 비율(%) — recv는 inbound, send는 상대 remote-inbound 기준
resource: app/src/lib/analyzer/analyzer.derive.ts
tags: [sdk, metric, derived]
timestamp: 2026-06-30T00:00:00Z
---

# 정의
`loss(%) = ΔpacketsLost / (ΔpacketsLost + Δpackets) × 100`

- recv: `inbound-rtp.packetsLost` 기준.
- send: 상대가 보고한 `remote-inbound-rtp.packetsLost`(+ `fractionLost`) 기준.
- 카운터 리셋/결측 → `undefined`.

# 관련
- 계산: [sdk/modules/analyzer](../modules/analyzer.md)
- 진단: [scenarios/high-packet-loss](../../scenarios/high-packet-loss.md)
