---
type: decision
title: 끊긴 peer는 제거 대신 ended로 유지
description: 무수신 peer를 evict하지 않고 ended로 남기고, 제거는 용량 cap 초과 시만
resource: server/lib/hub.ts
tags: [server, decision, hub, lifecycle]
timestamp: 2026-06-30T00:00:00Z
---

# 결정
- 무수신 30초 → `ended` 표시(목록 유지). 다시 수신되면 부활.
- 실제 제거(`gone`)는 보관 상한(`MAX_PEERS` = 100) 초과 시만, 가장 오래 ended된 것부터.

# 사유
- 탭 닫힘 등으로 끊긴 연결도 추적 가능해야 함(트랙 ended와 같은 취지). 그냥 사라지면 "있었는지"조차 모름.
- 무한 누적은 메모리 위험 → cap으로 안전장치.

# 관련
- 구현: [server/modules/hub](../modules/hub.md)
- 진단: [scenarios/track-ended](../../scenarios/track-ended.md)
