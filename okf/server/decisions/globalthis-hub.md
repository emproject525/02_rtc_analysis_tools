---
type: decision
title: hub는 globalThis 싱글톤 (단일 프로세스 전제)
description: Next HMR/route별 번들 중복 생성을 막아 POST/SSE가 같은 hub 공유
resource: server/lib/hub.ts
tags: [server, decision, hub]
timestamp: 2026-06-30T00:00:00Z
---

# 결정
hub 인스턴스를 `globalThis`에 매달아 프로세스 전역 하나로 공유한다.

# 사유
- Next.js는 HMR·route별 번들 분리로 모듈 지역 싱글톤이 중복 생성될 수 있음 → POST와 SSE가 다른 hub를 보게 됨.
- 단일 프로세스 전제. 다중 인스턴스/서버리스로 가면 globalThis로 부족 → hub의 `push`/`subscribe` 인터페이스를 유지한 채 내부를 Redis Pub/Sub로 교체(현재 범위 밖).

# 관련
- 구현: [server/modules/hub](../modules/hub.md)
