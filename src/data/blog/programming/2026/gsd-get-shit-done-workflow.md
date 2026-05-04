---
title: "65개 스킬로 돌아가는 AI 코딩 워크플로우: gsd-build/get-shit-done"
description: "프로젝트 탐색부터 실행, 리뷰, 검증까지 Phase 기반으로 관리하는 get-shit-done(GSD) — 65개 스킬과 33개 에이전트가 어떻게 맞물리는지 살펴봤습니다."
pubDate: 2026-05-04T10:58:00+09:00
category: programming
tags: ["Tools"]
version: "v1.0"
---

Claude Code로 혼자 개발하다 보면 어느 순간 흐름을 잃습니다. 지금 계획 중인지, 실행 중인지, 검증 중인지 경계가 흐려집니다. [get-shit-done(GSD)](https://github.com/gsd-build/get-shit-done)은 이 경계를 명확히 나눠주는 Phase 기반 워크플로우 시스템입니다. 65개 스킬과 33개 백그라운드 에이전트로 구성되어 있고, obra/superpowers와 함께 쓸 때 가장 잘 맞습니다.

## Phase 기반 워크플로우

GSD의 핵심 아이디어는 단순합니다. 개발 작업을 명시적인 단계(Phase)로 나누고, 각 Phase마다 전용 스킬을 씁니다.

```text
/gsd-new-project    → 프로젝트 초기화, 마일스톤 설계
/gsd-explore        → 소크라테스식 아이디어 탐색
/gsd-plan-phase     → 구현 계획 작성
/gsd-execute-phase  → 병렬 실행
/gsd-review         → 코드·디자인·문서 리뷰
/gsd-validate-phase → 테스트 및 검증
/gsd-verify-work    → 목표 달성 여부 확인
```

각 단계가 끝나야 다음 단계로 넘어간다는 규율이 있어서, 계획도 없이 코드부터 쓰거나 검증 없이 완료를 선언하는 일을 방지합니다.

## 주요 스킬 분류

**프로젝트 생명주기**

- `/gsd-new-project` — 새 프로젝트를 시작할 때 깊은 컨텍스트를 수집하고 마일스톤과 로드맵을 생성합니다
- `/gsd-new-milestone` — 마일스톤 단위 목표를 설정하고 관리합니다
- `/gsd-complete-milestone` — 마일스톤 종료 시 아카이빙과 회고를 진행합니다
- `/gsd-extract-learnings` — 작업에서 얻은 인사이트를 문서화합니다

**Phase 실행**

- `/gsd-discuss-phase` — 팀 동기화 토론
- `/gsd-spec-phase` — 기술 명세 작성
- `/gsd-secure-phase` — 보안 리뷰
- `/gsd-ai-integration-phase` — AI 기능 추가
- `/gsd-ui-phase` — UI 설계 및 구현
- `/gsd-ultraplan-phase` — 장기 복잡 계획 수립

**리뷰 · 감사**

- `/gsd-code-review` — 코드 체계적 리뷰
- `/gsd-ui-review` — 디자인 리뷰
- `/gsd-audit-fix` — 프로덕션 수정 감사 추적
- `/gsd-audit-milestone` — 마일스톤 종료 감사

**일상 운영**

- `/gsd-manager` — 인터랙티브 Phase 대시보드
- `/gsd-health` — 프로젝트 상태 체크
- `/gsd-debug` — 버그 조사 세션 관리
- `/gsd-fast` — 빠른 실행 모드

## 33개 백그라운드 에이전트

스킬이 사용자와 대화하는 인터페이스라면, 에이전트는 실제 작업을 수행하는 워커입니다. 대표적인 것들입니다.

- `gsd-project-researcher` — 도메인 리서치
- `gsd-pattern-mapper` — 코드베이스 패턴 분석
- `gsd-code-reviewer` / `gsd-code-fixer` — 코드 리뷰와 수정
- `gsd-debugger` / `gsd-debug-session-manager` — 멀티 사이클 디버그
- `gsd-executor` — 계획 실행 (원자적 커밋, 체크포인트 관리)
- `gsd-verifier` — Phase 목표 달성 검증
- `gsd-security-auditor` — 보안 위협 완화 검증

`/gsd-execute-phase`를 실행하면 `gsd-executor`가 백그라운드에서 태스크를 원자적으로 커밋하면서 진행합니다. 실패하면 체크포인트로 돌아갑니다.

## superpowers와의 관계

GSD는 superpowers 위에서 동작합니다. superpowers가 "어떻게 작업하는가"에 대한 규율(TDD, 디버깅 절차, 계획 작성법 등)을 제공한다면, GSD는 "어떤 순서로 작업하는가"에 대한 구조를 제공합니다.

실제로 `/gsd-plan-phase`를 실행하면 내부적으로 `superpowers:writing-plans` 스킬의 형식을 따르고, `/gsd-execute-phase`는 `superpowers:executing-plans` 패턴을 활용합니다. 두 도구를 함께 설치하면 이 연결이 자연스럽게 이루어집니다.

## 설치

```bash
claude mcp add gsd -- npx -y @gsd-build/get-shit-done
```

설치 후 `/gsd-help`로 사용 가능한 커맨드를 확인하거나, `/gsd-new-project`로 바로 시작할 수 있습니다.

## 참고 자료

- GitHub: https://github.com/gsd-build/get-shit-done
