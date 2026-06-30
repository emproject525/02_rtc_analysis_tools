---
type: page
title: SDK playground
description: 브라우저 SDK가 RTCPeerConnection을 관찰해 품질 지표를 수집·가공·전송하는 playground 페이지
resource: app/src/playground.ts
tags: [sdk, playground]
timestamp: 2026-06-30T00:00:00Z
---

# 개요

실브라우저 스모크용 loopback 데모 (라이브러리 번들에는 포함되지 않음).
한 페이지에서 RTCPeerConnection 2개를 직접 연결해 진짜 getStats를 만들고,
observe()로 collector→analyzer→reporter 파이프라인을 눈으로 확인한다.

`pnpm dev`로 띄운 뒤 [start]를 누르면 sender/receiver 두 peer의 Report가 콘솔과 화면에 실시간으로 찍힌다.

sender는 하나의 RTCPeerConnection에 3개의 Track을 전송한다.

- canvas 캡처 1 (video)
- canvas 캡처 2 (video)
- WebAudio 오실레이터 (audio)

# 화면

| 요소                   | 설명                                                                          |
| ---------------------- | ----------------------------------------------------------------------------- |
| serverUrl 입력창       | 수집 서버 URL. 기본값·placeholder = `http://localhost:3000/api/collect`. 값이 있으면 observe의 `serverUrl`로 전달(라이브 `.value`) |
| `start` 버튼           | sender/receiver RTCPeerConnection 생성·연결, 트랙 3개 전송, 두 peer `observe` 시작 |
| `stop` 버튼            | 두 peer `close` + observe 종료, 정리                                          |
| status 텍스트          | `idle` / `connected — version …` / `stopped`                                  |
| sender (outbound) 패널 | sender peer의 Report를 JSON으로 실시간 표시 (`onReport` 콜백)                 |
| receiver (inbound) 패널| receiver peer의 Report를 JSON으로 실시간 표시                                 |

레이아웃: 상단에 입력창·`start`·`stop`·status, 하단에 sender/receiver 패널을 좌우 2열로.

# 관련
- 구현: `app/src/playground.ts` + `app/index.html`
- 옵션: [sdk/schemas/observe-options](../schemas/observe-options.md) · 출력: [sdk/schemas/report](../schemas/report.md)
