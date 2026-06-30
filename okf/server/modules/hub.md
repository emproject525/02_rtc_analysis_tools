---
type: module
title: Hub
description: 수집한 Report를 메모리에 모으고 SSE 구독자에게 브로드캐스트하는 globalThis 싱글톤
resource: server/lib/hub.ts
tags: [server, module, hub]
timestamp: 2026-06-30T00:00:00Z
---

# 역할
`Map<peerId, { latest, series(300 ring), lastSeenAt, endedAt? }>`. `push` / `snapshot` / `subscribe`.

- `push`: latest 교체 + series ring(300) + 구독자 통지
- `snapshot`: 현재 모든 peer `{ report, ended }[]` (SSE 초기 1회)
- 무수신 30초 → ended 표시(유지), `gone`은 보관 cap(100) 초과 시만 — [decisions/ended-retention](../decisions/ended-retention.md)
- `globalThis` 싱글톤 — [decisions/globalthis-hub](../decisions/globalthis-hub.md)

# 관련
- 수신: [server/apis/collect](../apis/collect.md) · 푸시: [server/apis/stream](../apis/stream.md)
