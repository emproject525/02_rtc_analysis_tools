---
type: decision
title: ssrc 단위 집계 + ended 트랙 유지
description: 트랙 통계를 ssrc로 미분/집계하고, 사라진 ssrc는 ended로 목록에 남김
resource: app/src/lib/analyzer/analyzer.module.ts
tags: [sdk, decision, analyzer, lifecycle]
timestamp: 2026-06-30T00:00:00Z
---

# 결정
- 미분/집계는 **ssrc 단위**로 prev와 매칭(simulcast 레이어별 별도 ssrc). rid로 sender encoding 설정 매칭.
- 사라진 ssrc는 제거하지 않고 **`ended:true`로 목록 잔존**. ended 시 흐름 파생값(bitrate 등)은 비우고 누적/정적값만 유지.

# 사유
- getStats는 매 폴링 살아있는 ssrc만 줌 → 끊긴 트랙을 추적하려면 본 적 있는 ssrc 레지스트리 필요.
- ended 트랙에 옛 bitrate를 남기면 "아직 흐르는 것처럼" 오해 → 흐름값만 비움.
- 미분용 직전 샘플(`_prev`)과 생명주기 레지스트리는 분리해 간섭 방지.

# 관련
- 구현: [sdk/modules/analyzer](../modules/analyzer.md)
- 진단: [scenarios/track-ended](../../scenarios/track-ended.md)
