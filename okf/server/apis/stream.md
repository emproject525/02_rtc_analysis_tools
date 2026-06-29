---
type: api-endpoint
title: GET /api/stream (SSE)
description: 대시보드가 구독하는 단방향 SSE 스트림
resource: server/app/api/stream/route.ts
tags: [server, api, sse]
timestamp: 2026-06-29T00:00:00Z
---

# 계약

- `Content-Type: text/event-stream`, `EventSource` 표준(자동 재연결)
- 연결 직후 `snapshot`(`{ report, ended }[]`) 1회 → 이후 델타:
  - `report` — 새 Report 1건
  - `ended` — `{ peerId }` 끊김 표시(목록 유지)
  - `gone` — `{ peerId }` 용량 초과로 제거
- keep-alive 주석 핑(15초)으로 프록시 idle 타임아웃 방지

# 관계

- 데이터원: [server/architecture](../architecture.md) hub
- 소비자: [server/pages/dashboard](../pages/dashboard.md)
