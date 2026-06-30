---
type: decision
title: 폴링은 재귀 setTimeout (setInterval 아님)
description: tick 완료 후 다음 폴링을 예약해 오버랩을 방지
resource: app/src/lib/peer-monitor/peer-monitor.module.ts
tags: [sdk, decision, peer-monitor]
timestamp: 2026-06-30T00:00:00Z
---

# 결정
`setInterval` 대신 tick 완료 후 `setTimeout`으로 다음 tick을 예약한다.

# 사유
- `getStats()`가 폴링 간격보다 오래 걸리면 `setInterval`은 tick을 **겹쳐** 실행 → collector의 전이 drain·analyzer 미분이 경합/엉킴.
- 재귀 setTimeout은 항상 직전 tick이 끝난 뒤 간격을 두고 다음을 예약 → 오버랩 없음.

# 관련
- 구현: [sdk/modules/peer-monitor](../modules/peer-monitor.md)
