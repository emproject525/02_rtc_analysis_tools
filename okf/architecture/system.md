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

- `app/` — SDK (Vite, ESM+IIFE 듀얼 빌드, 런타임 의존성 0), Vitest로 TDD 개발
- `server/` — Next.js(App Router) 수집 API + 대시보드
- `okf/` — 이 지식 번들

# 범위

한 줄(`observe()`)로 연결 상태·품질 지표를 수집해 대시보드에 실시간 표시.

Non-goals: 미디어 내용 분석, 시그널링 개입, 프레임워크 종속, 인증, 영구 저장.

# 기술 스택

TypeScript, pnpm 워크스페이스. SDK = Vite 8(Rolldown), 서버 = Next.js.

# 실행 / 개발

| 작업              | 명령                                  |
| ----------------- | ------------------------------------- |
| SDK 개발 서버     | `pnpm dev:app` (플레이그라운드)       |
| 서버 개발 서버    | `pnpm dev:server` (대시보드 :3000)    |
| SDK 빌드          | `pnpm build:app` (ESM+IIFE)           |
| 서버 빌드         | `pnpm --filter ...dashboard build`    |
| SDK 테스트        | `pnpm --filter @rtc/peer-analyst test` (Vitest) |
| 린트              | `pnpm lint`                           |

- **E2E 스모크**: `app/`의 loopback 플레이그라운드(`pnpm dev:app`)에서 한 페이지에 RTCPeerConnection 2개를 연결해 진짜 stats 생성 → `observe`로 파이프라인 확인. 입력창에 `serverUrl`을 넣으면 `:3000` 대시보드까지 흐른다.
- **정답지 검증**: [references/webrtc-internals](../references/webrtc-internals.md)와 수치 대조.
