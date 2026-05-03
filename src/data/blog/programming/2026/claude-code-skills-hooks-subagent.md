---
title: "Claude Code의 Skills, Hooks, Subagent — 세 가지 확장 메커니즘 비교"
description: "Claude Code를 확장하는 세 가지 방법인 Skills, Hooks, Subagent의 역할과 차이를 정리합니다. 언제 어떤 메커니즘을 선택해야 할지 기준을 잡아드립니다."
pubDate: 2026-05-03T19:18:15+09:00
category: programming
tags: ["Tools"]
version: "v1.0"
---

Claude Code를 쓰다 보면 자동화와 재사용을 위해 세 가지 확장 지점을 마주하게 됩니다. Skills, Hooks, 그리고 Subagent인데요. 이름은 들어봤는데 막상 "이 상황엔 뭘 써야 하지?"라는 질문 앞에서 막히는 분들이 많더라고요. 저도 처음엔 혼용하다가 한 번쯤 정리가 필요하다고 느꼈습니다.

세 메커니즘은 역할 자체가 달라서, 비교 기준을 **"무엇을", "언제", "누가"** 로 잡으면 꽤 빠르게 구분됩니다.

## Skills — "무엇을 어떻게 할지" 절차 가이드

Skills는 Claude에게 특정 작업의 절차와 규칙을 알려주는 **프롬프트 템플릿**에 가깝습니다. `.claude/skills/{name}/SKILL.md` 경로에 마크다운으로 작성하고, `/skill-name` 슬래시 커맨드로 직접 호출합니다.

예를 들어 "블로그 초안 작성"이라는 반복 작업이 있다면, frontmatter 규칙·톤·파일 경로·커밋 컨벤션을 모두 SKILL.md 하나에 담아두고 `/blog-draft`로 호출하면 됩니다. Claude는 그 문서를 읽고 지시를 따릅니다.

핵심은 **수동 호출**이라는 점입니다. 어떤 이벤트에 자동으로 반응하는 게 아니라, 사용자가 명시적으로 "이 절차로 작업해줘"라고 지시하는 구조입니다.

```text
.claude/
  skills/
    blog-draft/
      SKILL.md        ← 절차·규칙 정의
      templates/
        works.md      ← 카테고리별 양식 참고
```

Skills가 적합한 경우:
- 복잡한 절차가 반복되는 작업 (초안 작성, 코드 리뷰, 보안 감사 등)
- 특정 포맷이나 컨벤션을 강제해야 할 때
- 여러 단계를 순서대로 실행해야 할 때

## Hooks — "언제" 자동으로 반응할지 이벤트 핸들러

Hooks는 Claude Code의 특정 이벤트에 **자동으로 실행되는 셸 명령**입니다. `.claude/settings.json` 또는 사용자 설정 파일의 `hooks` 섹션에 정의하고, Claude가 아니라 **하네스(harness)가 직접 실행**합니다.

이벤트 종류는 크게 다음과 같습니다:

- `PreToolUse` / `PostToolUse` — 특정 도구 호출 전후
- `SessionStart` / `Stop` — 세션 시작·종료 시
- `UserPromptSubmit` — 사용자 메시지 제출 시

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          { "type": "command", "command": "npm run lint --silent" }
        ]
      }
    ]
  }
}
```

Hooks의 결정적인 특징은 Claude의 메모리나 선호를 바꾸는 게 아니라는 점입니다. "앞으로 Edit 할 때마다 lint 돌려줘"라고 Claude에게 부탁하면, Claude는 그 세션 안에서 잊어버릴 수 있습니다. 반면 Hooks에 등록해두면 세션과 무관하게 항상 실행됩니다.

Hooks가 적합한 경우:
- 특정 도구 사용 후 반드시 실행해야 하는 검증 로직
- 세션 시작 시 환경 준비 스크립트
- "앞으로 X를 할 때마다 Y를 자동으로" 패턴 — 메모리가 아닌 설정으로 강제

## Subagent — "누가" 할지 작업 위임

Subagent는 현재 Claude 인스턴스가 **다른 Claude 인스턴스를 생성해서 작업을 위임**하는 메커니즘입니다. Claude Code SDK의 `Agent` 도구를 통해 호출하며, 부모 에이전트와 독립된 컨텍스트에서 실행됩니다.

주요 용도는 두 가지입니다.

**병렬 처리**: 서로 독립적인 작업을 동시에 실행할 때. 예컨대 테스트 검증과 린트 검사를 병렬로 돌리거나, 여러 파일을 동시에 조사할 때 유용합니다.

**컨텍스트 보호**: 방대한 코드베이스 탐색처럼 메인 컨텍스트 창을 많이 소모할 작업을 Subagent에 격리해서 처리하는 전략이기도 합니다.

```text
부모 에이전트 (대화 흐름 관리)
  ├── Subagent A: 파일 탐색 (Explore 타입)
  └── Subagent B: 빌드 검증 (general-purpose 타입)
```

Subagent에는 타입별로 접근 가능한 도구가 다릅니다 (`Explore`, `Plan`, `general-purpose` 등). 코드를 직접 수정하는 Subagent를 쓸 때는 `isolation: "worktree"` 옵션으로 git 워크트리를 격리해 메인 작업에 영향을 주지 않게 할 수도 있습니다.

Subagent가 적합한 경우:
- 서로 독립적인 긴 작업을 병렬로 실행해야 할 때
- 메인 컨텍스트를 오염시키지 않고 넓은 범위를 탐색할 때
- 전문화된 에이전트 타입을 활용하고 싶을 때

## 세 가지를 한 줄로 정리하면

| | Skills | Hooks | Subagent |
|---|---|---|---|
| 역할 | 절차·규칙 안내 | 이벤트 자동 반응 | 작업 위임·병렬화 |
| 실행 주체 | Claude (사람이 호출) | 하네스 (자동) | 별도 Claude 인스턴스 |
| 호출 방식 | `/skill-name` 슬래시 커맨드 | 이벤트 발생 시 자동 | `Agent` 도구 |
| 상태 | 컨텍스트 내 유지 | 설정 파일에 영구 등록 | 독립 컨텍스트 |
| 대표 사용 사례 | 블로그 초안, 보안 리뷰 | 파일 저장 후 lint, 세션 시작 환경 준비 | 병렬 탐색, 컨텍스트 격리 |

## 실제로 어떻게 조합하나요

세 메커니즘은 배타적이지 않고 자연스럽게 조합됩니다. 예를 들어 이 블로그의 텔레그램 봇 파이프라인은 이렇게 구성되어 있습니다:

1. **SessionStart Hook** — 세션이 열릴 때 Python 환경을 활성화하고 필요한 종속성을 확인
2. **`/blog-draft` Skill** — 블로그 초안 작성의 모든 절차를 담은 SKILL.md를 읽고 실행
3. **Subagent (Explore 타입)** — 기존 슬러그 충돌 확인처럼 넓은 파일 탐색이 필요한 하위 작업에 사용

처음 Claude Code를 확장하기 시작할 때는 Skills부터 시작하는 걸 추천합니다. 작성하기 쉽고, 어떤 작업에 절차가 필요한지 파악하다 보면 Hooks와 Subagent를 어디에 쓸지도 자연스럽게 보이기 시작하거든요.
