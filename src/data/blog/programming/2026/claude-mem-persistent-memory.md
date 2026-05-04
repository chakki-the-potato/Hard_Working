---
title: "세션이 끊겨도 기억은 남는다: thedotmack/claude-mem"
description: "매 세션마다 컨텍스트를 재구성하는 비용을 줄여주는 claude-mem — observation 시스템, knowledge-agent, AST 기반 코드 탐색이 어떻게 협력하는지 정리했습니다."
pubDate: 2026-05-04T10:59:59+09:00
category: programming
tags: ["Tools"]
version: "v1.0"
---

Claude Code의 치명적 단점은 세션이 끊기면 모든 컨텍스트가 사라진다는 점입니다. 어제 어떤 파일을 수정했는지, 어떤 결정을 내렸는지, 어디까지 진행했는지를 다음 세션에서 처음부터 다시 설명해야 합니다. [thedotmack/claude-mem](https://github.com/thedotmack/claude-mem)은 세션 간 기억을 유지하는 MCP 서버입니다.

## 동작 원리

claude-mem은 세션 중 Claude의 행동을 자동으로 observation으로 기록합니다. 파일을 읽거나 수정하고, 코드를 실행하고, 결정을 내리는 모든 과정이 타임스탬프와 함께 저장됩니다. 다음 세션이 시작될 때 관련 observation이 자동으로 컨텍스트에 주입됩니다.

```text
세션 A:
  파일 수정 → observation 기록
  결정 문서화 → observation 기록
  버그 수정 → observation 기록

세션 B (새로운 세션):
  관련 observation 자동 주입
  → Claude가 이전 작업 컨텍스트를 이미 알고 있음
```

## 주요 도구

**관찰 · 검색**

- `mcp__plugin_claude-mem_mcp-search__search` — 날짜, 타입, 프로젝트 필터로 observation을 검색합니다
- `mcp__plugin_claude-mem_mcp-search__timeline` — 특정 검색 결과 전후 맥락을 가져옵니다. 연속된 작업 흐름을 파악할 때 씁니다
- `mcp__plugin_claude-mem_mcp-search__get_observations` — 특정 observation의 전체 상세 내용을 가져옵니다

**Knowledge Agent (corpus 기반 질의)**

세 단계로 동작합니다.

```text
build_corpus   → observation들로 질의 가능한 knowledge base 생성
prime_corpus   → 생성된 corpus를 현재 세션에 로드
query_corpus   → 자연어로 corpus에 질문
```

단순 키워드 검색이 아니라 의미 기반으로 질문할 수 있어서, "지난주에 인증 로직 변경한 이유가 뭐였지?" 같은 질문에도 답을 찾습니다.

**AST 기반 코드 탐색**

- `smart_outline` — 파일의 함수·클래스·인터페이스 구조를 tree-sitter AST로 추출합니다
- `smart_search` — 코드베이스 전체에서 특정 심볼을 AST 기반으로 검색합니다
- `smart_unfold` — 특정 함수나 클래스의 전체 구현을 펼칩니다

grep 기반 검색보다 정확하고, 파일 전체를 읽지 않아도 됩니다.

## 스킬 목록

claude-mem은 MCP 도구 외에 슬래시 커맨드 스킬도 제공합니다.

- `/claude-mem:learn-codebase` — 저장소 전체를 한 번에 학습해 corpus를 구축합니다. 새 프로젝트에 처음 합류할 때 유용합니다
- `/claude-mem:knowledge-agent` — 구축된 corpus에 대화 형식으로 질문합니다
- `/claude-mem:smart-explore` — 코드베이스를 AST 기반으로 구조적으로 탐색합니다
- `/claude-mem:pathfinder` — 특정 기능이 어떤 파일들을 거쳐 구현되는지 추적합니다
- `/claude-mem:mem-search` — observation 검색 인터페이스
- `/claude-mem:timeline-report` — 기간별 작업 타임라인을 생성합니다

## 실제 활용 패턴

새 세션을 시작할 때 `/claude-mem:mem-search`로 어제 한 작업을 먼저 조회합니다. 이전에 내린 결정이 기록되어 있어서 "왜 이 구조로 짰지?" 같은 의문을 다시 풀지 않아도 됩니다.

큰 코드베이스를 분석할 때는 `/claude-mem:learn-codebase`를 먼저 실행합니다. 한 번 corpus를 구축해두면 이후 세션에서도 `query_corpus`로 바로 질문할 수 있습니다. 파일을 일일이 열어보는 것보다 훨씬 빠릅니다.

## 설치

```bash
claude mcp add claude-mem -- npx -y @thedotmack/claude-mem
```

`/claude-mem:how-it-works`로 동작 원리를 더 자세히 확인할 수 있습니다.

## 참고 자료

- GitHub: https://github.com/thedotmack/claude-mem
