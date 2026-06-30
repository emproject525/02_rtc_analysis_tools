---
type: decision
title: transceiver 스냅샷은 항목 단위로 부분 실패 격리
description: 한 transceiver 접근 예외가 그 폴링 전체 매핑을 날리지 않게 항목별 try/catch
resource: app/src/lib/collector/collector.module.ts
tags: [sdk, decision, collector]
timestamp: 2026-06-30T00:00:00Z
---

# 결정
transceiver 스냅샷을 **항목 단위 try/catch**로 감싸 문제 항목만 조용히 스킵한다(전체 try/catch 아님).

# 사유
- `pc.close()`와 폴링 타이머가 겹치면 특정 transceiver의 `getParameters()`/`mid`/`track` 접근이 throw할 수 있음.
- 전체를 한 try/catch로 감싸면 한 항목 예외에 그 폴링의 **모든** trackId·encodings 매핑이 날아감.
- 항목별로 격리하면 정상 항목은 보존, 스킵된 항목은 다음 폴링에 복귀.

# 관련
- 구현: [sdk/modules/collector](../modules/collector.md)
