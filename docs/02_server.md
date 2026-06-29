# 수집 서버 / 대시보드 (server)

SDK가 보낸 Report를 받아 메모리 hub에 모으고, 대시보드에 SSE로 실시간 푸시한다.
아키텍처 개요는 [overview.md](./overview.md)의 "데이터 전송 / 아키텍처" 참고. 이 문서는
구현에 필요한 **결정된 계약/정책**을 정리한다.

```txt
SDK ──POST /api/collect──▶ [ hub (globalThis) ] ──SSE /api/stream──▶ 대시보드
                                 │
                    Map<peerId, { latest, series }>
```

기술 스택: **Next.js (App Router)** + TypeScript. Route Handler로 API를, 페이지로
대시보드를 구현한다. 패키지명 `@rtc/peer-analyst-dashboard`, 워크스페이스 멤버.

## 계약 타입 공유

Report / 봉투(envelope) 스키마는 **app 패키지를 단일 소스로 재사용**한다
(`import type { Report } from "@rtc/peer-analyst"`). 서버가 별도로 타입을 복제하지
않아 SDK 변경이 곧장 반영된다.

## API

### `POST /api/collect`

SDK reporter가 봉투를 POST 하는 수집 엔드포인트.

- 본문: `{ sentAt: number, sdkVersion: string, reports: Report[] }`
- 처리: 봉투의 `reports`를 순회해 각 Report를 hub에 push.
- 응답: 성공 **`204 No Content`** (reporter는 응답 본문을 안 쓴다).
- 검증 실패(봉투 형식 아님/JSON 깨짐): **`400`**. 형식만 보고, **인증 토큰은 검증하지
  않는다** (인증은 non-goal — `getHeaders`로 토큰이 와도 서버는 통과시킨다).

### `GET /api/stream` (SSE)

대시보드가 구독하는 단방향 푸시 스트림.

- `Content-Type: text/event-stream`, `EventSource` 표준 사용(자동 재연결).
- **연결 직후 초기 스냅샷 1회**: 현재 hub의 모든 peer를 `snapshot` 이벤트로 먼저 보낸다.
  payload는 `Array<{ report, ended }>` (ended 여부를 알아야 끊긴 연결도 그릴 수 있다).
  (없으면 대시보드를 새로 열 때 다음 Report까지 빈 화면)
- 이후 델타를 스트리밍:
  - `report` 이벤트 — 새 Report 1건 (peer 갱신/신규)
  - `ended` 이벤트 — `{ peerId }` 끊김 표시(목록 유지)
  - `gone` 이벤트 — `{ peerId }` 용량 초과로 실제 제거
- 이벤트 형식: `event: <kind>\n` + `data: <json>\n\n`.

## hub (`globalThis` 싱글톤)

Next.js는 HMR·route별 번들 분리로 모듈 지역 싱글톤이 중복 생성될 수 있어, hub는
`globalThis`에 매달아 프로세스 전역 하나로 공유한다.

### 데이터 모델

```ts
Map<peerId, {
  latest: Report;     // 현재 상태 — 연결 목록·상세 표시용 (항상 최신으로 교체)
  series: Report[];   // 최근 N개 롤링 윈도우 — 그래프용 (ring buffer)
  lastSeenAt: number; // 마지막 수신 시각 (Date.now)
  endedAt?: number;   // ended로 표시된 시각 (살아있으면 undefined)
}>
```

`peerId`는 SDK observe 단위 식별자(사용자 지정 또는 자동 UUID). hub는 이걸로 키잉한다.

### 버퍼 N = peer당 300개 (ring buffer)

`series`는 고정 크기 큐다. `length`가 300에 도달하면 **가장 오래된 것을 `shift`로
빼고 새 것을 `push`** → 항상 최근 300개만 유지. 2초 간격이면 약 10분치. `latest`는
이와 별개로 항상 현재 1개.

### ended 표시 (TTL 30초) + 용량 cap

peer가 끊겨도(탭 닫힘 등) **제거하지 않고 ended로 표시해 목록에 남긴다** — 끊긴 트랙을
ended로 남기는 것과 같은 취지(끊긴 연결도 계속 추적). 주기 sweep(10초)으로
`now - lastSeenAt > 30초`이고 아직 ended가 아닌 peer를 `endedAt` 표시 + `ended` 이벤트
푸시. 다시 수신되면 부활(`endedAt` 해제).

실제 제거(`gone`)는 **보관 상한(`MAX_PEERS` = 100) 초과 시에만**, 가장 오래 ended된
peer부터(없으면 가장 오래된 수신) 제거한다. 메모리 보호용 안전장치이지 정상 흐름이 아니다.

### 인터페이스

route 코드가 의존하는 최소 표면. 확장 시(다중 인스턴스) 내부를 Redis Pub/Sub로
교체해도 이 표면만 유지하면 route는 그대로 (현재 범위 밖).

```ts
hub.push(report: Report): void               // 수집 → latest 교체 + series ring + 통지
hub.snapshot(): { report, ended }[]          // 현재 모든 peer (SSE 초기 스냅샷)
hub.subscribe(fn): () => void                // SSE 구독, 해제 함수 반환
// 이벤트 kind: report | ended | gone
```

## CORS / preflight

SDK는 보통 **서비스 페이지(다른 오리진)** 에서 POST 한다. 게다가 `getHeaders`로
`Authorization` 같은 커스텀 헤더가 붙으면 브라우저가 **preflight `OPTIONS`** 를 먼저
보낸다 — 이를 처리하지 않으면 POST가 막힌다.

- `POST`·`OPTIONS` 모두 CORS 헤더를 응답한다.
  - `Access-Control-Allow-Origin`: 기본 `*`, 필요 시 env(`DASHBOARD_ALLOW_ORIGIN`)로
    화이트리스트. (쿠키를 안 쓰므로 `*` 허용 가능)
  - `Access-Control-Allow-Methods`: `POST, OPTIONS`
  - `Access-Control-Allow-Headers`: `content-type, authorization`
- `OPTIONS`는 `204`로 빠르게 응답.

## 대시보드 UI

- `/` 페이지에서 `EventSource('/api/stream')` 구독 → 초기 `snapshot`으로 현재 연결을
  그리고, `report`/`ended`/`gone` 델타로 라이브 갱신. 클라이언트가 `report` 스트림을
  쌓아 자체 히스토리(최근 300개)를 만들어 그래프를 그린다(webrtc-internals와 같은 방식).
- 좌측 peer 목록(ended는 흐리게 유지) + 우측 상세(connection·transport + **트랙별 그래프**).
- **트랙은 audio/video 구분 없이 전부 리스트업**, 각 트랙이 자기 그래프 카드 1개.
- **그래프 = bitrate 시계열 라인**(chrome://webrtc-internals candidate-pair 스타일이되
  누적이 아니라 순간 bitrate). **호버하면 그 시점의 모든 지표**(누적 카운터 포함)를
  툴팁으로. 의존성 0 (inline SVG).
- `ended` 트랙/peer는 흐리게 + 라인 색 구분.

## 결정 요약

| 항목 | 결정 |
| --- | --- |
| 엔드포인트 | `POST /api/collect`, `GET /api/stream`, 대시보드 `/` |
| 수신 본문 | 봉투 `{ sentAt, sdkVersion, reports[] }`, 성공 204 / 형식오류 400 |
| 인증 | 검증 안 함 (non-goal) |
| hub 모델 | `Map<peerId, { latest, series, lastSeenAt, endedAt? }>`, `globalThis` 싱글톤 |
| 버퍼 N | peer당 300 ring buffer (shift+push) |
| ended | 30초 무수신 → `ended` 표시(목록 유지). `gone`은 cap(100) 초과 시만 |
| SSE | 연결 시 `snapshot`(`{report,ended}[]`) → `report`/`ended`/`gone` 델타 |
| CORS | `OPTIONS` 처리 + `*`(env 화이트리스트) + `authorization` 허용 |
| UI | 트랙별 bitrate 라인 그래프 + 호버 전체 지표 (inline SVG, 의존성 0) |
