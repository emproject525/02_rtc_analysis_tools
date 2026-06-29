---
okf_version: "0.1"
---

# RTC Analysis Tools — Knowledge Bundle

WebRTC `RTCPeerConnection` 품질을 모니터링하는 SDK(`app/`)와 수집·대시보드 서버(`server/`)에 대한 지식 번들. 이 코드베이스를 돕는 AI 에이전트가 매번 다시 알아내야 하는 구조·계약·동작을 담는다.

## 조직 규칙
- **경로 = 개념 ID.** 모든 개념은 `<영역>/<종류>/<개념>.md` 에 둔다 (영역 = `sdk`·`server`, 종류 = `modules`·`apis`·`pages` …).
- **규약(예외 1개):** 각 영역의 개요는 종류 폴더 없이 `<영역>/architecture.md` 에 둔다.

## type 어휘
- `architecture` — 영역/시스템 전반 구조
- `module` — 코드 구성요소 (collector, analyzer …)
- `api-endpoint` — HTTP 엔드포인트
- `page` — 렌더링되는 UI 화면

## 개념 목록

### sdk
- [sdk/architecture](sdk/architecture.md)
- [sdk/modules/collector](sdk/modules/collector.md)
- [sdk/modules/analyzer](sdk/modules/analyzer.md)
- [sdk/modules/reporter](sdk/modules/reporter.md)

### server
- [server/architecture](server/architecture.md)
- [server/apis/collect](server/apis/collect.md)
- [server/apis/stream](server/apis/stream.md)
- [server/pages/dashboard](server/pages/dashboard.md)
