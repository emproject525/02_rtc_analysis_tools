---
type: module
title: Analyzer
description: 누적 stats를 직전 폴링과 미분해 순간 지표로 만들고 ssrc 단위로 집계하는 가공 레이어
resource: app/src/lib/analyzer/analyzer.module.ts
tags: [sdk, analyzer, metrics]
timestamp: 2026-06-29T00:00:00Z
---

# 역할

[collector](collector.md)의 RawSample을 정규화된 Report로 가공한다.

- **미분 파생값**: bitrate(`Δbytes × 8 / Δt`), packet loss율, 재전송률, 평균 jitter buffer delay. 누적 카운터 리셋/결측 시 undefined.
- inbound/outbound-rtp를 `mid`·`ssrc`로 join, sender encodings를 `rid`로 매칭(maxBitrate/active 등 노출)
- **ended 생명주기**: 본 적 있는 ssrc 레지스트리로 사라진 트랙을 `ended:true`로 목록에 잔존. ended 시 흐름 파생값(bitrate 등)은 비움.

# 관계

- 이전: [collector](collector.md) / 다음: [reporter](reporter.md)
- 파생 계산식은 `analyzer.derive.ts`
