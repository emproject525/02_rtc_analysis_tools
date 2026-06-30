---
type: architecture
title: 시스템 개요
description: RTCPeerConnection 모니터링 SDK와 수집·대시보드 서버의 전체 구조·범위
resource: .
tags: [overview, architecture]
timestamp: 2026-06-30T00:00:00Z
---

# 데이터 흐름

```
SDK(app) ──POST──▶ 수집 서버(server) ──SSE──▶ 대시보드
```

- [sdk/architecture](../sdk/architecture.md): 브라우저에서 RTCPeerConnection을 관찰해 지표 수집·전송
- [server/architecture](../server/architecture.md): Report 수집(hub) → 대시보드로 SSE 푸시

# 모노레포 구조
- `app/` — SDK (Vite, ESM+IIFE 듀얼 빌드, 런타임 의존성 0)
- `server/` — Next.js(App Router) 수집 API + 대시보드
- `okf/` — 이 지식 번들

# 범위
한 줄(`observe()`)로 연결 상태·품질 지표를 수집해 대시보드에 실시간 표시.

Non-goals: 미디어 내용 분석, 시그널링 개입, 프레임워크 종속, 인증, 영구 저장.

# 기술 스택
TypeScript, pnpm 워크스페이스. SDK = Vite 8(Rolldown), 서버 = Next.js.
