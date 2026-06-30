---
type: scenario
title: 트랙·연결이 ended로 표시됨
description: 대시보드에서 peer/track이 ended(흐림)로 바뀐 이유를 가르는 플레이북
resource: server/lib/hub.ts
tags: [diagnostic, lifecycle, ended]
timestamp: 2026-06-30T00:00:00Z
---

# 증상
대시보드에서 peer 또는 트랙이 흐려지고 `(ended)` 표시.

# 확인 순서
1. **트랙 ended vs peer ended** 구분.
   - 트랙만 ended → 해당 ssrc가 getStats에서 사라짐 (replaceTrack / 레이어 종료 / 재협상).
   - peer 전체 ended → hub가 **30초 무수신**으로 표시 (서버가 Report를 못 받는 중).
2. peer ended면: 마지막 `connectionState` 값 확인 (`closed` / `failed` / `disconnected`?).
3. **gone과 구분**: 목록에서 아예 사라졌다면 ended가 아니라 보관 cap(100) 초과로 제거된 것.

# 해석
- peer ended = "탭 닫힘 / 네트워크 끊김 / unobserve" 중 하나. 데이터가 안 올 뿐 기록은 유지됨(의도된 동작).
- 트랙 ended는 흐름 파생값(bitrate 등)이 비워지고 마지막 누적값만 남는다.

# 관련
- ended 정책: [server/architecture](../server/architecture.md) hub
- 트랙 생명주기: [sdk/modules/analyzer](../sdk/modules/analyzer.md)
