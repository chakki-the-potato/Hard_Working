---
title: "컨텍스트 윈도우를 아끼는 MCP: mksglu/context-mode"
description: "raw tool output이 컨텍스트를 가득 채우는 문제를 FTS5 SQLite sandbox로 해결하는 context-mode — ctx_batch_execute, ctx_search, ctx_stats가 어떻게 동작하는지 정리했습니다."
pubDate: 2026-05-04T10:58:52+09:00
category: programming
tags: ["Tools"]
version: "v1.0"
---

Claude Code로 대규모 작업을 하다 보면 컨텍스트 윈도우가 빠르게 차오릅니다. `find`, `ls -la`, `git log` 같은 명령어 출력이 수백 줄씩 컨텍스트에 쌓이고, 정작 중요한 코드 분석에 쓸 공간이 줄어듭니다. [mksglu/context-mode](https://github.com/mksglu/context-mode)는 이 문제를 MCP 서버 방식으로 해결합니다.

## 핵심 아이디어

발상은 단순합니다. **Claude가 직접 raw output을 받지 않아도 된다.** 명령어 실행 결과를 FTS5 전문 검색 SQLite 데이터베이스에 인덱싱해두고, Claude는 필요한 부분만 검색해서 가져옵니다. 컨텍스트에는 검색 결과 스니펫만 들어오기 때문에 토큰 소비가 크게 줄어듭니다.

```text
기존 방식:
  명령 실행 → 수백 줄 raw output → 컨텍스트에 전부 적재

context-mode:
  명령 실행 → FTS5 DB에 인덱싱 → Claude가 검색 쿼리 → 관련 스니펫만 반환
```

## 주요 도구

**`ctx_batch_execute`** — 가장 자주 쓰는 핵심 도구입니다. 여러 명령어를 한 번에 실행하고, 출력을 자동 인덱싱하고, 즉시 검색까지 수행합니다. 여러 Bash 호출로 나눌 것을 단일 호출로 처리합니다.

```json
{
  "commands": [
    { "label": "프로젝트 구조", "command": "find . -name '*.ts' | head -50" },
    { "label": "패키지 의존성", "command": "cat package.json" }
  ],
  "queries": ["API endpoint", "authentication"]
}
```

**`ctx_search`** — 이미 인덱싱된 내용에서 검색합니다. 이전 세션에서 인덱싱한 내용도 다시 찾을 수 있습니다.

**`ctx_index`** — 문서나 코드를 명시적으로 인덱싱합니다. 외부 문서를 컨텍스트로 가져올 때 씁니다.

**`ctx_fetch_and_index`** — URL을 가져와 HTML을 마크다운으로 변환한 뒤 인덱싱합니다. WebFetch 대신 씁니다.

**`ctx_execute`** — JavaScript, Python, Shell 코드를 sandbox에서 실행합니다. 데이터 처리나 분석 용도로 씁니다.

**`ctx_stats`** — 현재 세션의 컨텍스트 소비량과 절약량을 수치로 보여줍니다.

**`ctx_insight`** — 90가지 지표를 담은 생산성 대시보드입니다. 어떤 작업에 컨텍스트를 많이 썼는지 파악할 수 있습니다.

## 사용 규칙

context-mode가 효과를 내려면 몇 가지 규칙을 따라야 합니다.

- **20줄 이상 출력이 나올 Bash 명령은 `ctx_batch_execute`를 씁니다.** 그냥 Bash를 쓰면 raw output이 컨텍스트에 적재됩니다.
- **파일 분석은 `ctx_execute_file`을 씁니다.** Read는 수정 의도가 있을 때만 씁니다.
- **WebFetch 대신 `ctx_fetch_and_index`를 씁니다.**
- **파일 생성·수정은 반드시 Write/Edit 도구를 씁니다.** ctx_execute에서 파일을 만들면 안 됩니다.

이 규칙들이 CLAUDE.md나 시스템 프롬프트에 명시되어야 Claude가 자동으로 지킵니다. context-mode는 프롬프트 수준에서 작동 방식을 강제하는 방식이라, 지침 없이 설치만 하면 효과가 없습니다.

## ctx_stats 예시

```text
ctx stats → 현재 세션 컨텍스트 소비 현황
  총 입력 토큰: 48,200
  context-mode 절약: 31,500 (65.4%)
  인덱싱된 청크: 847개
  검색 호출: 23회
```

처음 봤을 때 65%라는 수치가 인상적이었습니다. 코드베이스 탐색 작업처럼 명령어 출력이 많이 나오는 경우일수록 절약률이 올라갑니다.

## 설치

```bash
claude mcp add context-mode -- npx -y @mksglu/context-mode
```

설치 후 CLAUDE.md에 사용 규칙을 추가해야 실질적인 절약 효과를 볼 수 있습니다. `/context-mode:ctx-doctor`로 설정 상태를 진단할 수 있습니다.

## 참고 자료

- GitHub: https://github.com/mksglu/context-mode
