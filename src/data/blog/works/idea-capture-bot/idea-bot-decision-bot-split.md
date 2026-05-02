---
title: "결정 1 — 단일 봇 prefix 라우팅 대신 별도 봇으로 나눈 이유"
description: "처음에는 한 봇 안에서 [blog/...]·[ideas/...] prefix로 분기했는데, prefix 오타 한 번이 30분짜리 작성 루틴을 돌릴 위험이 있어 결국 둘로 갈랐습니다."
pubDate: 2026-05-02T15:36:00+09:00
category: works
tags: ["Telegram", "Cloudflare Worker"]
project: "idea-capture-bot"
repoUrl: "https://github.com/chakki-the-potato/Hard_Working"
role: "Solo developer"
period: "2026.04 ~"
version: "v1.0"
---

<!-- HERO 이미지 추가 시:
     1. public/images/posts/idea-capture-bot/idea-bot-decision-bot-split/hero.png 파일 업로드
     2. frontmatter에 heroImage: "/Hard_Working/images/posts/idea-capture-bot/idea-bot-decision-bot-split/hero.png" 추가
     3. 이 주석 삭제 -->

시리즈 두 번째 글입니다. 시스템을 만들 때 가장 처음으로 *되돌린* 결정이 바로 이 부분이었어요. 단일 봇 안에서 prefix로 라우팅하는 안이 멀쩡해 보였는데, 운영을 시뮬레이션해 볼수록 위험이 보이더라고요.

## 처음 안 — 단일 봇 + prefix 라우팅

처음에는 텔레그램 봇을 하나만 두고 메시지 머리에 prefix를 붙여서 라우팅하려고 했습니다.

```text
[blog/programming] satisfies 연산자 정리
[ideas/thinking] OSS 공개 시점 판단 기준
```

prefix가 붙으면 그 카테고리로 강제, 없으면 자연어로 분류하는 식이에요. 운영 비용이 적고 인박스도 한 채팅창에 모이니까 깔끔해 보였습니다.

## prefix 오타 한 번이 만든 사고 시나리오

문제는 *오타 한 번의 무게*였어요. 가벼운 메모를 던지려고 `[ideas/...]`을 치려다가 `[idea/...]`처럼 오타가 나거나, 아예 prefix를 빼먹으면 자연어 분류로 넘어가서 *블로그 작성 루틴*을 트리거할 수 있었습니다.

블로그 작성은 SKILL.md를 통째로 읽고 본문을 1500~3000자로 풀어 쓰는, 길면 30분짜리 루틴이에요. 짧은 메모 하나 던졌다가 그게 발동하면 토큰도 시간도 한참 새고 나서 결과물도 의도와 어긋납니다.

<!-- 여기에 prefix 라우팅 위험 시나리오 다이어그램 삽입 (예: public/images/posts/idea-capture-bot/idea-bot-decision-bot-split/risk.png) -->

또 한 가지는 *채팅창의 인박스 성격*이 약해진다는 거였습니다. 한 봇에 블로그 초안과 잡다한 아이디어가 섞이면 스크롤할 때마다 "이건 뭐였더라" 하면서 다시 분류하게 되더라고요. 인박스는 *하나의 흐름*이어야 위로 쓸어 넘기는 부담이 없는데, 그 결이 깨졌어요.

## 별도 봇 + 별도 Worker로 분리한 후

결국 텔레그램 봇 자체를 둘로 갈랐습니다. Idea Bot, Blog Bot 각각 별도 토큰, 별도 Cloudflare Worker, 별도 Claude Code Routine으로요.

운영 비용은 약간 늘었습니다. BotFather에서 봇을 하나 더 만들고, Worker도 하나 더 띄우고, Routine도 하나 더 등록해야 했거든요. 대신 다음 두 가지를 얻었어요.

- **사고 위험 0** — 어느 봇에 메시지를 보내냐가 곧 어느 루틴이 도냐를 결정. 오타로 무거운 루틴이 발동할 가능성이 사라짐
- **채팅창 자체가 인박스** — Idea Bot 채팅창은 "아이디어만", Blog Bot 채팅창은 "초안만"이라 스크롤에 부담이 없음

prefix 라우팅도 여전히 살려두긴 했어요(같은 봇 안에서 카테고리 강제). 단지 "어떤 *루틴*이 돌 것인가"라는 가장 비싼 결정만은 prefix가 아니라 *봇 자체*로 갈라 두었습니다.

## 정리

작은 자동화일수록 *오타 한 번에 비싼 일이 일어나지 않게* 하는 게 중요하더라고요. 라우팅 같은 결정은 사람이 의식하지 않아도 자연스럽게 갈라지는 위치에 두는 게 안전했습니다. 다음 글에서는 Cloudflare Worker를 GitHub repo 연결이 아니라 대시보드에서 직접 deploy한 결정을 풀어볼게요.
