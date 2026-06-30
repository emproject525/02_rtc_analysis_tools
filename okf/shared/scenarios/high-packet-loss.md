---
type: scenario
title: 패킷 손실률 높음 진단
description: packetLossRate/fractionLost가 높을 때 네트워크 손실 여부를 가르는 플레이북
resource: app/src/lib/analyzer/analyzer.derive.ts
tags: [diagnostic, packet-loss, quality]
timestamp: 2026-06-30T00:00:00Z
---

# 증상
recv `packetLossRate` 또는 send `fractionLost`(상대측 보고) 상승.

# 확인 순서
1. **nackCount / pliCount / firCount** 상승? → 수신측이 재전송·키프레임을 계속 요청 = 실제 유실 발생 중.
2. **재전송률** 상승? → RTX로 메우는 중. 대역 낭비 비중 확인.
3. **jitter / jitterBufferDelay** 동반 상승? → 지연 변동까지 겹친 혼잡.
4. **transport RTT / candidate type** — relay(TURN) 경유면 경로 품질 의심.

# 해석
- 손실 + nack/pli↑ + 재전송률↑ → 네트워크 손실. RTX/FEC가 일부 복구하지만 한계.
- 손실인데 nack 없음 → 측정 구간 경계/카운터 리셋일 수 있음 (파생값이 undefined로 빠지는 구간인지 확인).

# 관련
- 손실률/재전송률 계산: [sdk/modules/analyzer](../../sdk/modules/analyzer.md)
- 관측 화면: [server/pages/dashboard](../../server/pages/dashboard.md)
