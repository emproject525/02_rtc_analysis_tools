---
type: page
title: 대시보드
description: 연결별 트랙 bitrate를 실시간 그래프로 보여주는 대시보드 화면
resource: server/app/page.tsx
tags: [server, dashboard, ui]
timestamp: 2026-06-29T00:00:00Z
---

# 화면

- [stream](../apis/stream.md) SSE를 `EventSource`로 구독 → 좌측 peer 목록 + 우측 선택 peer 상세(connection·transport + 트랙 그래프)
- 트랙별 **bitrate 시계열 라인 그래프** — 고정 간격 100개 윈도우, 새 점은 오른쪽으로 쌓이고 꽉 차면 왼쪽으로 스크롤(chrome://webrtc-internals 스타일이되 누적 아닌 순간 bitrate)
- **호버 시** 그 시점의 모든 지표(누적 카운터 포함)를 툴팁으로
- `ended` peer/track 흐리게, 스트림 live/끊김 인디케이터
- 차트 라이브러리 없이 inline SVG (의존성 0)

# 관계

- 데이터원: [server/apis/stream](../apis/stream.md)
