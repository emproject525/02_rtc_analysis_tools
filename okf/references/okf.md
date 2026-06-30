---
type: reference
title: Open Knowledge Format (OKF)
description: 이 번들이 따르는 개방형 지식 포맷 명세 (Google Cloud, v0.1 Draft)
resource: https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md
tags: [reference, okf]
timestamp: 2026-06-30T00:00:00Z
---

# 요약
AI 시스템용 메타데이터·맥락·지식을 표현하는 이식 가능한 포맷. 마크다운 + YAML frontmatter 디렉토리.

- **경로 = 개념 ID.** frontmatter 필수 필드는 `type` 하나(열린 어휘).
- 예약 파일: `index.md`(목록, 루트만 `okf_version` 허용), `log.md`(이력).
- 소비자는 모르는 type/키·깨진 링크로 번들을 거부하지 않는다.

# 이 번들의 규약
조직 규칙·type 어휘는 루트 [index.md](../index.md) 참고.

# Citations
- https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md
