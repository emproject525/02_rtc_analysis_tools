---
okf_version: "0.1"
---

# RTC Analysis Tools — Knowledge Bundle

WebRTC `RTCPeerConnection` 품질을 모니터링하는 SDK(`app/`)와 수집·대시보드 서버(`server/`)에 대한 지식 번들. 이 코드베이스를 돕는 AI 에이전트가 매번 다시 알아내야 하는 구조·계약·동작을 담는다.

## 조직 규칙
- **경로 = 개념 ID.** 모든 개념은 종류 폴더로 묶는다.
- **특정 패키지(app/server) 코드에 관한 지식** → 그 영역 밑: `<영역>/<종류>/<개념>.md` (영역 = `sdk`·`server`).
- **코드에 안 묶이는 지식** → 루트의 종류 폴더: `<종류>/<개념>.md` (예: `scenarios/`, `references/`).
- **규약:** 각 영역의 개요는 종류 폴더 없이 `<영역>/architecture.md` 에 둔다.

## type 어휘
- `architecture` — 영역/시스템 전반 구조
- `module` — 코드 구성요소 (collector, analyzer …)
- `api-endpoint` — HTTP 엔드포인트
- `page` — 렌더링되는 UI 화면
- `scenario` — 진단 플레이북 (증상 → 확인 → 해석)

## 개념 목록

### architecture
- [architecture/system](architecture/system.md)

### sdk
- [sdk/architecture](sdk/architecture.md)
- modules — [collector](sdk/modules/collector.md) · [analyzer](sdk/modules/analyzer.md) · [reporter](sdk/modules/reporter.md) · [peer-monitor](sdk/modules/peer-monitor.md)
- metrics — [bitrate](sdk/metrics/bitrate.md) · [packet-loss](sdk/metrics/packet-loss.md) · [retransmission](sdk/metrics/retransmission.md) · [jitter-buffer-delay](sdk/metrics/jitter-buffer-delay.md)
- decisions — [transport-keepalive](sdk/decisions/transport-keepalive.md) · [ssrc-lifecycle](sdk/decisions/ssrc-lifecycle.md) · [polling-settimeout](sdk/decisions/polling-settimeout.md)

### server
- [server/architecture](server/architecture.md)
- modules — [hub](server/modules/hub.md)
- apis — [collect](server/apis/collect.md) · [stream](server/apis/stream.md)
- pages — [dashboard](server/pages/dashboard.md)
- decisions — [ended-retention](server/decisions/ended-retention.md) · [cors-preflight](server/decisions/cors-preflight.md) · [dashboard-graph](server/decisions/dashboard-graph.md) · [globalthis-hub](server/decisions/globalthis-hub.md)

### scenarios
- [bitrate-drop](scenarios/bitrate-drop.md) · [high-packet-loss](scenarios/high-packet-loss.md) · [track-ended](scenarios/track-ended.md)

### references
- [okf](references/okf.md)
