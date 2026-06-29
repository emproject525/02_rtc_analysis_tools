---
type: module
title: Reporter
description: 가공된 Report를 봉투에 담아 수집 서버로 전송하는 출력 레이어
resource: app/src/lib/reporter/reporter.module.ts
tags: [sdk, reporter]
timestamp: 2026-06-29T00:00:00Z
---

# 역할

Report를 console / callback / server로 fan-out 한다. 서버 전송은 `ReportEnvelope { sentAt, sdkVersion, reports[] }` 봉투를 POST.

- 전송 수단 **keepalive fetch로 일원화**(sendBeacon 폐기) — `getHeaders`로 인증 헤더(토큰) 주입
- 생성 시기에 맞춰 **즉시 전송**(배치=1). 실패 시 큐 유지 재시도, 상한(100) 초과 시 오래된 것 드롭
- 페이지 이탈(`pagehide`) 시 최종 flush(keepalive). 백그라운드(hidden)에선 정리 안 하고 집계 지속

# 관계

- 이전: [analyzer](analyzer.md)
- 수신처: [server/apis/collect](../../server/apis/collect.md)
