---
type: scenario
title: 비트레이트 급락 진단
description: send/recv bitrate가 갑자기 떨어질 때 원인을 좁히는 플레이북
resource: app/src/lib/analyzer/analyzer.module.ts
tags: [diagnostic, bitrate, quality]
timestamp: 2026-06-30T00:00:00Z
---

# 증상
대시보드 트랙 그래프에서 bitrate 라인이 급락.

# 확인 순서
1. **qualityLimitationReason** (outbound) — `bandwidth`면 네트워크 상한, `cpu`면 인코딩 부하.
2. **재전송률 / packetLossRate** 동반 상승? → 네트워크 악화 신호.
3. **RTT / availableOutgoingBitrate** (transport) — 가용 대역 자체가 줄었는지.
4. **framesPerSecond / 해상도** 동반 하락? → 인코더가 품질을 낮춘 적응 동작.

# 해석
- bandwidth + 손실↑ + RTT↑ → 네트워크 혼잡. 인코더가 자발적으로 비트레이트를 낮춘 정상 적응일 수 있음.
- cpu → 송신측 부하. 해상도/fps 제한 검토.
- 손실 없이 bitrate만 0에 수렴 → 트랙 mute/정지 또는 곧 ended.

# 관련
- 지표 산출: [sdk/modules/analyzer](../../sdk/modules/analyzer.md)
- 관측 화면: [server/pages/dashboard](../../server/pages/dashboard.md)
