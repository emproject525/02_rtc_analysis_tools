---
type: decision
title: 수집 API CORS + OPTIONS preflight 처리
description: 다른 오리진 + 토큰 헤더로 인한 preflight를 위해 OPTIONS·CORS 헤더 응답
resource: server/app/api/collect/route.ts
tags: [server, decision, api, cors]
timestamp: 2026-06-30T00:00:00Z
---

# 결정
`POST`/`OPTIONS` 모두 CORS 헤더 응답. `Access-Control-Allow-Headers: content-type, authorization`, Origin 기본 `*`(env 화이트리스트).

# 사유
- SDK는 보통 다른 오리진의 서비스 페이지에서 POST. `getHeaders`로 `Authorization`이 붙으면 브라우저가 **preflight OPTIONS**를 먼저 보냄 → 처리 안 하면 POST가 차단됨.
- 쿠키 미사용이라 `*` 허용 가능.

# 관련
- 구현: [server/apis/collect](../apis/collect.md)
- 송신: [sdk/decisions/transport-keepalive](../../sdk/decisions/transport-keepalive.md)
