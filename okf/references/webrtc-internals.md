---
type: reference
title: chrome://webrtc-internals
description: 브라우저 내장 raw getStats 그래프 — 우리 대시보드의 정답지(검증용)
resource: chrome://webrtc-internals
tags: [reference, webrtc, debugging]
timestamp: 2026-06-30T00:00:00Z
---

Chrome 내장 진단 페이지. 살아있는 RTCPeerConnection의 raw getStats를 실시간 그래프로 보여준다.

- 우리 대시보드 그래프 모양(candidate-pair bytesSent 등)의 참고 원형.
- **검증 용도**: 우리 Report의 bitrate/fps/packets가 webrtc-internals 수치와 맞으면 collector·analyzer가 옳다는 근거.

# 관련
- 대시보드: [server/pages/dashboard](../server/pages/dashboard.md)
- 그래프 결정: [server/decisions/dashboard-graph](../server/decisions/dashboard-graph.md)
