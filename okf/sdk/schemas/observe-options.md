---
type: schema
title: ObserveOptions
description: observe(peer, options)에 넘기는 SDK 설정 계약
resource: app/src/lib/peer-monitor/peer-monitor.types.ts
tags: [sdk, schema]
timestamp: 2026-06-30T00:00:00Z
---

`window.PeerAnalyst.observe(peer, options)`에 넘기는 옵션. 전부 optional.

# Schema

| 필드          | 타입                                              | 기본      | 설명                                       |
| ------------- | ------------------------------------------------- | --------- | ------------------------------------------ |
| `interval?`   | `number`                                          | `2000`    | 폴링 간격(ms)                              |
| `serverUrl?`  | `string`                                          | -         | 있으면 Report 봉투를 이 엔드포인트로 POST  |
| `getHeaders?` | `() => Record<string,string> \| Promise<…>`       | -         | 전송 fetch에 얹을 헤더(토큰 등), 호출마다 평가 |
| `onReport?`   | `(report: Report) => void`                        | -         | Report 생성마다 콜백                       |
| `console?`    | `boolean`                                         | `false`   | Report를 콘솔 출력                         |
| `peerId?`     | `string`                                          | 자동 UUID | peer 식별자                                |

# 관련
- 진입: [sdk/architecture](../architecture.md) (공개 API)
- 소비: [sdk/modules/peer-monitor](../modules/peer-monitor.md) · [sdk/modules/reporter](../modules/reporter.md)
- 데이터: [sdk/schemas/report](report.md)
