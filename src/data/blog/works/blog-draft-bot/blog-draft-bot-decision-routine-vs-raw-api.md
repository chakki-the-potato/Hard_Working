---
title: "결정 2 — Claude Code Routine을 골랐고 raw API는 Phase A로 미뤘던 이유"
description: "Anthropic raw API로 직접 호출하는 게 길게 보면 옳은데, Phase 0에서 SDK·프롬프트 설계·tool use까지 동시 학습은 시간 부채가 너무 컸어요. Claude Code Routine으로 시작해 Phase A로 갈아타기로 한 트레이드오프입니다."
pubDate: 2026-05-02T16:05:10+09:00
category: works
tags: ["Claude Code", "Anthropic API"]
project: "blog-draft-bot"
repoUrl: "https://github.com/chakki-the-potato/Hard_Working"
role: "Solo developer"
period: "2026.04 ~"
version: "v1.0"
---

<!-- HERO 이미지 추가 시:
     1. public/images/posts/blog-draft-bot/blog-draft-bot-decision-routine-vs-raw-api/hero.png 파일 업로드
     2. frontmatter에 heroImage: "/Hard_Working/images/posts/blog-draft-bot/blog-draft-bot-decision-routine-vs-raw-api/hero.png" 추가
     3. 이 주석 삭제 -->

에이전트를 직접 구현할지, 이미 동작하는 환경을 그대로 쓸지 — 이 결정은 "어느 쪽이 더 좋은가"보다 "지금 내가 어느 쪽을 감당할 수 있는가"의 문제였어요.

## 처음 안 — Anthropic raw API로 직접 호출

길게 봤을 때는 raw API가 맞는 방향이에요. Anthropic SDK로 직접 호출하면 커스터마이징·비용 제어·다른 서비스와의 통합도가 훨씬 높습니다. 에이전트 루프를 직접 짜기 때문에 어디서 무슨 일이 일어나는지 완전히 파악할 수 있고요.

## 무엇이 막았나 — 학습 부채

문제는 Phase 0 시점에 동시에 해결해야 할 것들이 너무 많았다는 거예요. SDK 사용법, 시스템 프롬프트 설계, tool use 구현, 에이전트 루프 디버깅까지 — 이걸 동시에 익히면서 실제 동작하는 봇까지 만드는 건 시간 부채가 너무 컸습니다.

<!-- 여기에 학습 부채 vs 시간 트레이드오프 매트릭스 삽입 (예: public/images/posts/blog-draft-bot/blog-draft-bot-decision-routine-vs-raw-api/tradeoff-matrix.png) -->

## Routine으로 갔을 때 얻은 것

Claude Code Routine은 이미 제가 Claude Code를 통해 익힌 환경이었어요. 시스템 프롬프트, SKILL.md, 허용 도구 지정까지 아는 개념으로 세팅할 수 있었습니다. 에이전트가 어떻게 동작하는지 블랙박스 없이 파악된 상태에서 바로 글쓰기 자동화에 집중할 수 있었어요.

## Phase A로 미뤄둔 이유

raw API 구현은 미룬 게 아니라 *순서를 바꾼* 거예요. Routine으로 운영을 시작하고, 어떤 메시지 패턴이 잘 동작하는지 감을 잡고 나서 raw API로 갈아타는 게 — *그때 가야 더 잘 알고 만들게 된다*는 판단이었습니다. Phase A는 그 다음 단계로 예약해 두었어요.

## 정리

좋은 결정과 지금 할 수 있는 결정은 다를 수 있어요. Phase 0에서는 *지금 할 수 있는 것*으로 시작하고 *좋은 것*은 Phase A로 남겨두는 게 맞았습니다. 다음 글에서는 글쓰기 환경을 어떻게 세팅했는지를 다뤄보겠습니다.
