---
type: decision
title: 대시보드는 표 대신 bitrate 라인 그래프
description: 트랙별 순간 bitrate를 고정 간격 100개 윈도우 스트립 차트로, 호버 시 전체 지표
resource: server/app/page.tsx
tags: [server, decision, dashboard, ui]
timestamp: 2026-06-30T00:00:00Z
---

# 결정
- 트랙별 **bitrate 시계열 라인**(chrome://webrtc-internals 스타일이되 누적 아닌 순간값).
- **고정 간격 100개 윈도우**: 새 점은 오른쪽으로 쌓이고 꽉 차면 왼쪽으로 스크롤.
- 호버 시 그 시점의 전체 지표(누적 카운터 포함) 툴팁.
- inline SVG로 차트 라이브러리 의존성 0.

# 사유
- 전체를 너비에 늘리면 점이 늘수록 간격이 좁아짐 → 고정 step 윈도우가 실시간 추세에 적합.
- 표보다 그래프가 품질 추세를 직관적으로 보여줌. 세부 수치는 호버로.

# 관련
- 구현: [server/pages/dashboard](../pages/dashboard.md)
- 데이터: [server/apis/stream](../apis/stream.md)
