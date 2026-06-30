---
type: reference
title: W3C WebRTC Statistics API
description: getStats가 돌려주는 stat type·필드의 표준 정의
resource: https://www.w3.org/TR/webrtc-stats/
tags: [reference, webrtc, spec]
timestamp: 2026-06-30T00:00:00Z
---

`RTCPeerConnection.getStats()`가 돌려주는 통계 객체(`inbound-rtp`, `outbound-rtp`,
`candidate-pair`, `transport`, `codec` …)의 type·필드를 정의한 W3C 명세.

- 우리 [getStats 타입 뷰](../sdk/schemas/stats-view.md)와 [Report 스키마](../sdk/schemas/report.md) 필드의 근거.
- 필드 가용성은 브라우저별로 갈리므로 항상 optional 가정.

# Citations
- https://www.w3.org/TR/webrtc-stats/
