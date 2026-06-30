---
type: decision
title: 서버 전송은 keepalive fetch로 일원화 (sendBeacon 폐기)
description: 인증 헤더 때문에 sendBeacon 대신 fetch keepalive 사용
resource: app/src/lib/reporter/reporter.module.ts
tags: [sdk, decision, reporter, transport]
timestamp: 2026-06-30T00:00:00Z
---

# 결정
Report 봉투 전송을 모두 `fetch`로. 페이지 이탈 시에만 `keepalive: true`.

# 사유
- `sendBeacon`은 `Authorization` 등 **커스텀 헤더를 못 붙임**. 수집 API가 토큰을 요구할 수 있어 `getHeaders`로 헤더 주입이 필요 → fetch.
- `fetch keepalive`가 unload 중 전송 보장을 동일하게 제공(기능상 sendBeacon 상위호환).
- keepalive는 64KB 총량 제한이 있어 **평상시엔 일반 fetch, 이탈 시에만 keepalive**.
- 평상시 전송은 생성 즉시(배치=1), 실패 시 큐 유지 재시도 + 상한(100) crop.

# 관련
- 구현: [sdk/modules/reporter](../modules/reporter.md)
- 수신: [server/apis/collect](../../server/apis/collect.md) · [server/decisions/cors-preflight](../../server/decisions/cors-preflight.md)
