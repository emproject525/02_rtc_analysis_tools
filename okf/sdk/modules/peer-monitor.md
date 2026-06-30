---
type: module
title: Peer Monitor
description: collector→analyzer→reporter를 주기 폴링으로 오케스트레이션하는 SDK 단위
resource: app/src/lib/peer-monitor/peer-monitor.module.ts
tags: [sdk, module, orchestration]
timestamp: 2026-06-30T00:00:00Z
---

# 역할
`observe(peer, options)`가 만드는 peer당 1개 객체. 기본 2초마다 tick: [collector](collector.md) 수집 → [analyzer](analyzer.md) 가공 → [reporter](reporter.md) 전송.

- **재귀 setTimeout**으로 tick 완료 후 다음 예약(오버랩 방지) — [decisions/polling-settimeout](../decisions/polling-settimeout.md)
- `dispose()`: 타이머 정리 + 마지막 tick 1회(잔여 전이 flush) + reporter flush
- `startedAt`(epoch) 보관 → 연결 지속시간 = `Report.timestamp − startedAt`

# 관련
- 파이프라인: [collector](collector.md) · [analyzer](analyzer.md) · [reporter](reporter.md)
