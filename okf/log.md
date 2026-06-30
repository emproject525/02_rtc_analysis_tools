# Log

## 2026-06-29
- **Update**: OKF 번들 초기화. `sdk`/`server` 영역 구조와 `<영역>/<종류>/<개념>` 규칙, type 어휘(architecture/module/api-endpoint/page) 확정. 8개 개념 작성.

## 2026-06-30
- **Update**: `scenario` type 추가 + 루트 `scenarios/`에 진단 플레이북 3장(bitrate-drop, high-packet-loss, track-ended).
- **Update**: 조직 규칙 확정 — 코드 패키지에 묶이는 지식은 `<영역>/<종류>/`, 안 묶이는 지식은 루트 `<종류>/`. (`shared` 영역은 코드 관점이라 폐기)
- **Update**: `docs/` → okf 완전 이관. 빠진 개념 채움 — `architecture/system`, `references/okf`, sdk `metrics`(4)·`peer-monitor`·`decisions`(3), server `modules/hub`·`decisions`(4). 코드 주석의 docs 참조를 okf 경로로 갱신, `docs/` 제거.
- **Update**: `schema` type 추가 + `sdk/schemas/report.md`(Report/Envelope/TrackReport/TransportReport). collect·stream의 `Report` 참조를 스키마 개념으로 링크.
- **Update**: 개발 토대 보강 — schemas(observe-options·raw-sample·stats-view), sdk/architecture에 공개 API 표, architecture/system에 실행·개발 섹션, decisions/collector-partial-failure, references(webrtc-internals·webrtc-stats).
