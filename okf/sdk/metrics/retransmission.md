---
type: metric
title: Retransmission Rate
description: 전체 송신/수신 바이트 중 재전송(RTX) 비중(%)
resource: app/src/lib/analyzer/analyzer.derive.ts
tags: [sdk, metric, derived]
timestamp: 2026-06-30T00:00:00Z
---

# 정의
`retx(%) = Δretransmittedbytes / Δbytes × 100`

- 재전송은 TCP가 아니라 **RTP NACK/RTX(RFC 4588)·FEC** 로 UDP 위에서 자체 수행. `retransmittedBytes`는 `bytes`의 부분집합.
- 오르면 네트워크 악화 신호 — nack/pli와 함께 본다.

# 관련
- 계산: [sdk/modules/analyzer](../modules/analyzer.md)
- 진단: [scenarios/high-packet-loss](../../scenarios/high-packet-loss.md)
