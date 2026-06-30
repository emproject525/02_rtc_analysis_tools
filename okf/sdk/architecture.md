---
type: architecture
title: SDK 아키텍처
description: 브라우저 SDK가 RTCPeerConnection을 관찰해 품질 지표를 수집·가공·전송하는 구조
resource: app/
tags: [sdk, webrtc]
timestamp: 2026-06-29T00:00:00Z
---

# 개요

`import "peer-analyst"` 하면 `window.PeerAnalyst` 전역이 주입되고, `observe(peer, options)`로 `RTCPeerConnection`을 감시한다. 내부 4개 레이어를 peer-monitor가 오케스트레이션한다(기본 2초 폴링, 재귀 setTimeout으로 오버랩 방지).

# 공개 API (`window.PeerAnalyst`)

| 멤버                            | 설명                                                       |
| ------------------------------- | ---------------------------------------------------------- |
| `observe(peer, options?)`       | 감시 시작. peer당 멱등(이미 있으면 기존 monitor 반환).     |
| `unobserve(peer)`               | 감시 종료(마지막 flush 후 정리).                           |
| `close()`                       | 모든 peer 감시 종료.                                       |
| `version`                       | SDK 버전 (package.json 단일 소스).                         |
| `monitors`                      | `Map<RTCPeerConnection, PeerMonitor>` (내부 추적).         |

ESM(`import`)과 IIFE(`<script>` 전역) 둘 다 제공. 옵션 계약은 [ObserveOptions](schemas/observe-options.md).

# 파이프라인

수집 → 가공 → 전송:

- [collector](modules/collector.md) — 상태 전이·ICE 에러 버퍼링 + getStats 원본 + transceiver 스냅샷
- [analyzer](modules/analyzer.md) — 누적 stats를 순간 지표로 미분, ssrc 단위 집계, ended 생명주기
- [reporter](modules/reporter.md) — Report 봉투를 수집 서버로 전송

# 빌드

Vite 8(Rolldown) 라이브러리 모드로 ESM + IIFE 두 번들. IIFE는 `<script>`용 전역 주입.

# 관계

- 수신처: [server/architecture](../server/architecture.md)
