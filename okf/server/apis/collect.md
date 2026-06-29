---
type: api-endpoint
title: POST /api/collect
description: SDK가 Report 봉투를 보내는 수집 엔드포인트
resource: server/app/api/collect/route.ts
tags: [server, api, cors]
timestamp: 2026-06-29T00:00:00Z
---

# 계약

- 본문: `{ sentAt, sdkVersion, reports: Report[] }` (봉투)
- 성공 `204 No Content`, 봉투 형식 오류 `400`
- 인증 토큰은 **검증하지 않음**(non-goal) — 통과
- `reports`를 순회해 hub에 push

# CORS

- `OPTIONS` preflight 처리(`204`) + `POST`/`OPTIONS` 모두 CORS 헤더
- `Access-Control-Allow-Headers: content-type, authorization` (reporter `getHeaders` 토큰 대응), Origin 기본 `*`(env로 화이트리스트)

# 관계

- 송신자: [sdk/modules/reporter](../../sdk/modules/reporter.md)
- 수집처: [server/architecture](../architecture.md) hub
