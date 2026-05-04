---
title: "Claude Code 스킬 시스템의 시작: obra/superpowers 14가지 핵심 스킬"
description: "Claude Code에 워크플로우 규율을 심어주는 obra/superpowers — 브레인스토밍부터 TDD, 체계적 디버깅, 병렬 에이전트 실행까지 14가지 스킬이 어떻게 협력하는지 정리했습니다."
pubDate: 2026-05-04T10:56:15+09:00
category: programming
tags: ["Tools"]
version: "v1.0"
---

Claude Code를 처음 쓸 때 가장 먼저 드는 의문은 "그래서 어떻게 시작하지?"입니다. 코드를 생성하는 능력 자체는 충분한데, 언제 계획을 세우고, 언제 리뷰를 요청하고, 언제 커밋하는지에 대한 규율이 없으면 AI 코딩은 금세 무질서해집니다. [obra/superpowers](https://github.com/obra/superpowers)는 이 공백을 채우는 스킬 프레임워크입니다.

## superpowers란 무엇인가

Claude Code의 `Skill` 도구를 활용해 특정 워크플로우 지침을 로드하는 방식입니다. 슬래시 커맨드(`/superpowers:brainstorming` 등)나 자동 감지로 스킬 파일을 불러오면, Claude가 그 내용을 읽고 따릅니다.

핵심 규율은 하나입니다. **스킬이 적용될 가능성이 1%라도 있으면 반드시 호출한다.** 이 규칙이 중요한 이유는 "이건 간단한 질문이니까", "시간이 없으니까" 같은 합리화를 방지하기 위해서입니다. 체크 여부를 Claude가 판단하지 않고, 시스템 수준에서 강제합니다.

## 설치 방법

```bash
claude mcp add superpowers -- npx -y @obra/superpowers
```

또는 `~/.claude/settings.json`에 직접 MCP 서버로 등록합니다. 설치 후 슬래시 커맨드 목록에 `superpowers:*` 계열이 나타납니다.

## 14가지 핵심 스킬

역할별로 분류하면 이렇게 됩니다.

**기획 단계**

- `superpowers:brainstorming` — 구현 전 발산적 사고. 목표, 트레이드오프, 리스크를 먼저 펼쳐놓습니다
- `superpowers:writing-plans` — 계획 문서 작성 방법론. 목표 → 변경 파일 목록 → 변경 요약 → 검증 방법 4섹션이 기본 형식입니다
- `superpowers:executing-plans` — 계획을 단계별로 실행하는 체크포인트 방식

**개발 단계**

- `superpowers:test-driven-development` — 테스트 먼저 작성하는 사이클
- `superpowers:subagent-driven-development` — 병렬 서브에이전트로 큰 작업을 분해해 동시에 진행
- `superpowers:dispatching-parallel-agents` — 독립적인 작업을 동시에 실행하는 패턴

**품질 단계**

- `superpowers:systematic-debugging` — 가설 기반의 과학적 디버깅 절차. 증상이 아니라 원인을 좁혀나갑니다
- `superpowers:requesting-code-review` — 코드 리뷰를 올바르게 요청하는 방법
- `superpowers:receiving-code-review` — 리뷰를 받았을 때 처리하는 절차
- `superpowers:verification-before-completion` — "완료"라고 말하기 전 검증 체크리스트

**배포 · 마무리**

- `superpowers:finishing-a-development-branch` — 머지 전 브랜치를 정리하는 절차
- `superpowers:using-git-worktrees` — 여러 브랜치를 병렬로 작업하는 Git worktree 패턴

**메타**

- `superpowers:using-superpowers` — superpowers 자체를 설명하는 진입 스킬. 모든 세션의 시작점입니다
- `superpowers:writing-skills` — 커스텀 스킬을 직접 만드는 방법

## 스킬 호출 흐름

```text
사용자 메시지 도착
       ↓
스킬이 적용될 가능성이 1%라도 있는가?
  ├─ YES → Skill tool 호출 → 내용 로드 → 지침 따름
  └─ NO  → 바로 응답
```

처음엔 "스킬 체크하는 게 번거롭지 않나?" 싶었는데, 스킬 체크 자체가 Claude가 하는 일이라 사용자 입장에선 자연스럽게 흘러갑니다. 규율은 Claude가 지키고, 저는 결과를 봅니다.

## 실제 활용 조합

자주 쓰게 되는 패턴은 이렇습니다.

**새 기능 구현**: `brainstorming` → `writing-plans` → `executing-plans` 순서로 진행합니다. 계획 없이 바로 코드부터 쓰는 실수를 방지해 줍니다.

**버그 수정**: `systematic-debugging`을 호출해 현상을 기록하고, 가설을 세우고, 실험으로 좁혀나갑니다. 직감에 의존하는 디버깅보다 재현율이 훨씬 올라갔습니다.

**작업 마무리**: `requesting-code-review` → `finishing-a-development-branch` 조합으로 PR을 구조화합니다.

superpowers만으로는 프로젝트 단위 관리까지 커버하기 어렵습니다. 그 부분은 [get-shit-done(GSD)](https://github.com/gsd-build/get-shit-done)이 담당하는데, 두 도구를 함께 쓰면 스킬 규율 + 단계별 워크플로우가 맞물립니다.

## 참고 자료

- GitHub: https://github.com/obra/superpowers
