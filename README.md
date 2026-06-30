# RTC Analysis Tools

RTCPeerConnection의 연결 상태를 n초 간격으로 수집/분석하여 레포트로 작성하여 서버로 전송하는 역할을 하는 SDK

## 프로젝트 목적

WebRTC 통화 품질을 들여다보기 위해, **WebRTC 코드를 거의 건드리지 않고 `observe(peer)` 한 줄**로 연결 상태와 품질 지표(비트레이트·손실률·지터·RTT·재전송률 등)를 수집·분석해 수집 서버로 보내고, 대시보드에서 트랙별로 실시간 확인한다.

## 구조

- **`app/`** — 브라우저 SDK (`@rtc/peer-analyst`). `observe(peer)`로 수집→분석→전송. (Vite, ESM+IIFE, 런타임 의존성 0)
- **`server/`** — 수집 API + 대시보드 (`@rtc/peer-analyst-dashboard`, Next.js). Report를 hub에 모아 SSE로 대시보드에 푸시.
- **`okf/`** — 지식 번들(OKF). 아키텍처·모듈·지표·결정·스키마·진단 시나리오. **상세는 여기 참고.**

## 요구 환경

- Node ≥ 22.13 (`.nvmrc` = `22`), pnpm 11, pnpm 워크스페이스

## 빠른 시작

```sh
pnpm install
pnpm dev:app      # SDK 플레이그라운드 (loopback 데모)
pnpm dev:server   # 대시보드 (http://localhost:3000)
```

플레이그라운드의 `serverUrl` 입력에 `http://localhost:3000/api/collect`를 넣고 **start**를 누르면 SDK → 서버 → 대시보드 E2E가 흐른다.

## 명령

| 명령                                    | 설명                     |
| --------------------------------------- | ------------------------ |
| `pnpm -r build`                         | 전체 빌드 (app → server) |
| `pnpm --filter @rtc/peer-analyst test`  | SDK 테스트 (Vitest)      |
| `pnpm lint` / `pnpm format`             | 린트 / 포맷              |

## 더 알아보기

지식 번들 **`okf/`** 참고 (경로 = 개념 ID, 트리 탐색으로 발견).

- 시스템 전반: `okf/architecture/system.md`
- SDK / 서버: `okf/sdk/architecture.md`, `okf/server/architecture.md`
- 데이터 계약: `okf/sdk/schemas/report.md`, `okf/sdk/schemas/observe-options.md`

## 커밋 훅

`.githooks/pre-commit`이 `pnpm -r build`로 전체 빌드를 돌려 실패 시 커밋을 중단한다. (`prepare` 스크립트가 `core.hooksPath`를 `.githooks`로 설정. 훅은 `.nvmrc` 기준 Node로 실행)
