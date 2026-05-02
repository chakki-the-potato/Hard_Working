---
title: "결정 5+6 — 자동 push와 커밋 컨벤션이 알림 메타라인까지 만든다"
description: "commit만 하고 push는 수동으로 두면 폰만으로 흐름이 끝나지 않습니다. 자동 push와 idea(category/Tag) 컨벤션을 같이 깔자, 커밋 메시지가 알림의 메타라인까지 채워주더라고요."
pubDate: 2026-05-02T15:36:40+09:00
category: works
tags: ["Git", "Automation"]
project: "idea-capture-bot"
repoUrl: "https://github.com/chakki-the-potato/Hard_Working"
role: "Solo developer"
period: "2026.04 ~"
version: "v1.0"
---

<!-- HERO 이미지 추가 시:
     1. public/images/posts/idea-capture-bot/idea-bot-decision-push-and-commit/hero.png 파일 업로드
     2. frontmatter에 heroImage: "/Hard_Working/images/posts/idea-capture-bot/idea-bot-decision-push-and-commit/hero.png" 추가
     3. 이 주석 삭제 -->

이번 글은 두 결정을 묶어서 다룹니다. 따로 보면 사소한데, 같이 보면 *작은 컨벤션이 시스템 사이의 다리가 되는* 패턴이라 한 글로 묶었어요.

## 결정 5 — 자동 push로 마찰 0 만들기

처음에는 Claude Code Routine이 글을 작성하고 `git commit`까지만 하고, `git push`는 제가 수동으로 했습니다. "원격에 올리는 건 신중해야지"라는 생각이었어요.

그런데 운영하다 보니 이 한 단계가 *전체 가치를 깎아먹더라고요*. 시스템의 핵심 가치는 *폰만으로 끝나는 인박스*인데, push가 수동이면 결국 노트북을 열어서 터미널을 띄우게 됩니다. 그러면 마찰 0이라는 약속이 깨지고, 인박스 봇으로서의 의미가 절반 사라져요.

그래서 SKILL.md와 지침 양쪽에 한 줄을 박았습니다.

> `git commit` 직후 자동으로 `git push origin main` 실행

신중함은 *한 글당 한 글, main 브랜치 직접 push, 한 번에 한 글만 작성*이라는 다른 룰로 보장하기로 했어요. push 자체를 수동으로 두는 건 신중함이 아니라 *마찰*이었습니다.

## 결정 6 — 커밋 컨벤션이 알림 메타라인까지

처음에는 커밋 메시지를 단순하게 `idea: 글 제목` 형태로 적었습니다. 그런데 GitHub push 알림을 텔레그램으로 받으면서 *알림에 카테고리·태그 메타라인을 표시하고 싶다*는 욕심이 생겼어요.

문제는 메타라인을 만들려면 알림 발송 시점에 카테고리·태그 정보가 있어야 한다는 거였습니다. 알림은 Cloudflare Worker가 GitHub push webhook을 받아서 보내는데, Worker가 알 수 있는 정보는 *commit 메시지뿐*이었어요.

답은 *commit 메시지 자체에 정보를 박는* 거였습니다. 새 컨벤션으로 바꿨어요.

```text
draft(programming/Backend): Promise.allSettled 활용하기
draft(programming/agent-bot/Tools): 텔레그램 트리거를 Cloudflare Worker로
update(programming/Tools): ccusage로 사용량 한눈에 → v1.1
```

`draft|update(category/[project/]Tag1)` 형태인데요, Worker가 정규식으로 `category`와 `Tag1`을 파싱해서 알림 메시지에 메타라인으로 붙여줍니다.

<!-- 여기에 commit → 알림 메타라인 매핑 도식 삽입 (예: public/images/posts/idea-capture-bot/idea-bot-decision-push-and-commit/mapping.png) -->

알림은 이렇게 두 줄로 늘었어요.

```text
새 글이 push됐습니다
Programming / Backend ─ Promise.allSettled 활용하기
```

신·구 컨벤션 폴백도 살려뒀습니다. 옛 형식의 commit이 들어와도 알림이 깨지진 않고, 단지 메타라인이 폴더 경로 fallback으로만 표시돼서 정보가 줄 뿐이에요.

## 정리

작은 컨벤션 하나가 *시스템 사이의 다리*가 됩니다. commit 메시지는 보통 "사람이 읽기 위한 기록"이지만, 자동화 흐름에서는 *기계가 다음 단계로 넘기는 신호*이기도 해요. 그래서 컨벤션을 일찍 잡아두면, 그 위에 새 자동화를 얹기가 훨씬 가벼워지더라고요. 다음 글에서는 push와 workflow_run을 분리해 만든 알림 3단계를 다뤄보겠습니다.
