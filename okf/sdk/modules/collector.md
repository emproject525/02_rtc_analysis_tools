---
type: module
title: Collector
description: 상태 전이·icecandidateerror를 버퍼링하고 getStats 원본과 transceiver 스냅샷을 모으는 수집 레이어
resource: app/src/lib/collector/collector.module.ts
tags: [sdk, collector]
timestamp: 2026-06-29T00:00:00Z
---

# 역할

원본만 모은다(가공 없음). 해석·미분은 [analyzer](analyzer.md)가 한다.

- connection/ice/gathering/signaling 4개 상태 변화를 폴링 간 버퍼에 쌓아 drain (짧은 전이도 누락 방지)
- `icecandidateerror`(code/text/url/address/port) 버퍼링
- `getStats()` 결과를 손대지 않고 RawSample에 그대로 전달
- transceiver 스냅샷(mid/direction/track id/sender encodings) — **항목 단위 try/catch로 부분 실패 격리** (문제 transceiver만 스킵, 다음 폴링에 복귀)

# 관계

- 다음 단계: [analyzer](analyzer.md)
- 종료 시 마지막 폴링 flush는 peer-monitor가 호출
