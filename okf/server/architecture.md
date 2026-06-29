---
type: architecture
title: 서버 아키텍처
description: 수집 API로 Report를 받아 메모리 hub에 모으고 SSE로 대시보드에 푸시하는 Next.js 서버
resource: server/
tags: [server, nextjs]
timestamp: 2026-06-29T00:00:00Z
---

# 개요

Next.js(App Router). 흐름:

```
SDK ──POST collect──▶ hub(globalThis 싱글톤) ──SSE stream──▶ dashboard
```

- 수신: [server/apis/collect](apis/collect.md)
- 푸시: [server/apis/stream](apis/stream.md)
- 표시: [server/pages/dashboard](pages/dashboard.md)

# hub

`Map<peerId, { latest, series(300 ring buffer), lastSeenAt, endedAt? }>`. 단일 프로세스 전제라 `globalThis`에 매달아 POST/SSE route가 공유한다.

- 무수신 30초 → `ended` 표시(목록 유지)
- 실제 제거(`gone`)는 보관 cap(100) 초과 시만, 오래 ended된 것부터

# 관계

- 송신자: [sdk/architecture](../sdk/architecture.md) (reporter)
