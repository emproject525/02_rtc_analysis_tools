# Overview

`RTCPeerConnection`의 상태를 지속적으로 감시하는 모니터링 SDK와, 수집한 데이터를 받아 보여주는 대시보드. SDK(`app/`)를 서비스 페이지에 import 하면 전역에 `PeerAnalyst`를 주입하고, 이미 만들어진 `RTCPeerConnection` 인스턴스를 넘기면 연결 상태와 품질 지표를 실시간으로 수집·분석해 수집 서버(`server/`)로 전송한다. 수집 서버는 받은 데이터를 대시보드 화면에 렌더링한다. WebRTC 코드를 거의 건드리지 않고 한 줄 붙여서 연결 상태를 들여다보는 것에 초점이 있다.

```js
import "peer-analyst";

const peer = new RTCPeerConnection();
window.PeerAnalyst.observe(peer, {
  /* options */
});
```

## 사용 시나리오

1. 서비스 페이지가 SDK를 import 한다. → 전역에 `PeerAnalyst` 주입.
2. 기존에 만든 `RTCPeerConnection`을 `observe(peer, options)`로 넘긴다.
3. SDK가 해당 연결의 상태 변화 이벤트를 구독해 **전이 버퍼**에 쌓고, `getStats()`를 주기적으로 폴링한다. 폴링 때 버퍼에 모인 전이를 함께 비워 보내므로, 폴링 간격 안에서 짧게 일어난 전이(`connected→disconnected→connected` 등)나 `icecandidateerror` 같은 순간 이벤트도 누락되지 않는다.
4. 수집한 원시 데이터를 RTT·지터·패킷손실·비트레이트 등 지표로 가공한다.
5. 결과를 출력 대상(콘솔 / 콜백 / 수집 서버)으로 내보낸다.
6. 수집 서버(`server/`)가 데이터를 받아 대시보드 화면에 렌더링한다.
7. 연결 종료 또는 `unobserve(peer)` 시 구독과 폴링을 정리한다.

성공 기준: **WebRTC 코드를 수정하지 않고 `observe()` 한 줄로 연결 상태와 품질 지표가 수집되어, 대시보드에서 실시간으로 보인다.**

## MVP 범위

### SDK (`app/`)

- 전역 주입 (`window.PeerAnalyst`) + `observe()` / `unobserve()`
- 연결 상태 추적 (`connectionState`, `iceConnectionState`, `iceGatheringState`, `signalingState`)
- 폴링 간 상태 전이 버퍼링 (집계 간격 안의 짧은 전이 · `icecandidateerror` 보존)
- `getStats()` 주기 폴링
- 핵심 품질 지표 추출 (RTT, jitter, packet loss, bitrate)
- 콘솔 / 콜백 출력 + 수집 서버 전송
- 다중 `RTCPeerConnection` 동시 감시

### 수집 서버 / 대시보드 (`server/`)

- SDK가 보낸 리포트를 받는 수집 API
- 받은 연결 상태 / 품질 지표를 화면에 렌더링하는 대시보드

## 데이터 전송 / 아키텍처

```txt
SDK(app) ──HTTP POST──▶ 수집 서버(server) ──SSE──▶ 대시보드
                              │
                         globalThis hub
                    (EventEmitter + 최근 N개 메모리 버퍼)
```

- **SDK → 서버**: HTTP POST (주기적 배치 + 페이지 이탈 시 `sendBeacon`). 단방향 쓰기라 소켓 불필요. `options.serverUrl`로 POST 대상만 받는다.
- **서버 → 대시보드**: SSE. 단방향 푸시엔 WebSocket보다 가볍고 `EventSource` 표준 + 자동 재연결. Next.js Route Handler로 구현.
- **단일 프로세스 전제**: POST와 SSE가 같은 데이터를 공유하기 위해 hub(EventEmitter + 메모리 버퍼)를 둔다. Next.js에선 HMR·route별 번들 분리로 모듈 지역 싱글톤이 중복 생성될 수 있어, hub는 **`globalThis`에 매달아** 프로세스 전역 하나로 공유한다.
- **확장 시**: cluster / 다중 인스턴스 / 서버리스로 가면 프로세스가 갈려 `globalThis`로는 부족하다. 그때 hub 내부를 Redis Pub/Sub로 교체한다. hub의 `push`/`subscribe` 인터페이스만 유지하면 route 코드는 그대로. (현재 범위 밖)

## Non-goals (이번 범위에서 안 하는 것)

- 미디어 내용(영상·음성) 자체 분석
- 시그널링/네트워크 경로 개입·제어
- SDK의 프레임워크 종속 (React/Vue 래퍼 등)
- 인증 / 사용자 식별
- 영구 저장소 / 장기 보관·집계 _(스트레치)_

## 현재 구현 상태

아직 시작 전. `app/`, `server/` 모두 비어 있다.

| 영역                            | 상태 | 비고                    |
| ------------------------------- | ---- | ----------------------- |
| (SDK) 전역 주입 / `observe` API | ⬜   | -                       |
| (SDK) 상태 추적 (collector)     | ⬜   | -                       |
| (SDK) `getStats()` 폴링         | ⬜   | -                       |
| (SDK) 지표 분석 (analyzer)      | ⬜   | -                       |
| (SDK) 출력 (reporter)           | ⬜   | 콘솔 / 콜백 / 서버 전송 |
| (SDK) 빌드 (ESM + IIFE)         | ⬜   | -                       |
| (API) 수집 API                  | ⬜   | -                       |
| (API) 대시보드 화면             | ⬜   | -                       |

> 디렉터리 구조는 [structure.md](./structure.md) 참고.

## 기술 스택

- **SDK 빌드**: Vite 8 (Rolldown), 라이브러리 모드 (ESM + IIFE 듀얼 출력)
- **수집 서버 / 대시보드**: Next.js
- **언어**: TypeScript
- **패키지 매니저**: pnpm
- **SDK 런타임 의존성 없음** — 브라우저 표준 `RTCPeerConnection` API만 사용
