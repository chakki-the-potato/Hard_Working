---
title: "텔레그램 아이디어 봇 — 시스템 개요와 컴포넌트 분리"
description: "폰 텔레그램에 메모를 던지면 1분 안에 블로그에 게시되는 자동화 시스템. 라우터·작업자·매뉴얼을 셋으로 분리한 이유를 7편 시리즈의 첫 글로 정리해 봤습니다."
pubDate: 2026-05-02T15:31:07+09:00
category: works
tags: ["Cloudflare Worker", "Claude Code"]
project: "idea-capture-bot"
repoUrl: "https://github.com/chakki-the-potato/Hard_Working"
role: "Solo developer"
period: "2026.04 ~"
version: "v1.0"
---

<!-- HERO 이미지 추가 시:
     1. public/images/posts/idea-capture-bot/idea-bot-system-overview/hero.png 파일 업로드
     2. frontmatter에 heroImage: "/Hard_Working/images/posts/idea-capture-bot/idea-bot-system-overview/hero.png" 추가
     3. 이 주석 삭제 -->

폰의 텔레그램 봇에 짧은 메모를 던지면, 30초에서 1분 사이에 GitHub Pages 블로그의 `/ideas/` 섹션에 자동으로 글이 올라옵니다. 처음에는 "그냥 한 군데에서 다 처리하면 되지 않나"라고 단순하게 시작했는데, 만들어 가면서 *컴포넌트를 셋으로 분리해야겠다*는 결론에 도달하더라고요.

이번 글은 시스템의 큰 그림과 세 컴포넌트의 책임을 정리하는 시리즈의 첫 편입니다. 실제로 운영하면서 마주친 결정 7개는 이어지는 6편에서 한 편씩 다룰 예정이에요.

## 시스템 한눈에

전체 흐름은 이렇습니다.

```text
폰 텔레그램 (Idea Bot)
   ↓ webhook
Cloudflare Worker (idea-bot-proxy)
   ├─ 인증, 즉시 ack
   └─ Claude Code Routine 호출
        ↓
   맥북의 Claude Code (Idea Capture Agent)
        ├─ SKILL.md 로드
        ├─ 분류 + 본문 작성
        └─ git commit + push
   ↓ GitHub webhook
Cloudflare Worker
   └─ 텔레그램으로 알림 전송
   ↓
Astro 빌드 → GitHub Pages
```

<!-- 여기에 시스템 아키텍처 다이어그램 삽입 (예: public/images/posts/idea-capture-bot/idea-bot-system-overview/architecture.png) -->

세 개의 독립적인 시스템(Cloudflare Worker, Claude Code Routine, 블로그 레포)이 webhook으로 느슨하게 연결된 구조입니다. 각자 책임이 다르고, 한 부분이 망가져도 다른 부분이 살아있도록 설계해 두었어요.

## 세 컴포넌트의 책임 분리

가장 중요한 설계 결정이라면, 시스템을 *라우터·작업자·매뉴얼* 세 층으로 깔끔하게 나눈 것입니다.

**Cloudflare Worker — 라우터**

24시간 떠있는 작은 서버입니다. 판단력은 거의 없고 *정해진 규칙대로 라우팅*만 합니다. 메시지가 오면 인증하고(허용된 chat_id인지, HMAC 서명이 맞는지), 즉시 ack 메시지를 보내고, Claude Code Routine을 호출하는 게 전부예요. GitHub의 push·workflow_run 이벤트를 받아서 텔레그램으로 알림을 쏘는 역할도 합니다.

**Claude Code Routine — 작업자**

호출되면 깨어나서 글을 쓰는 에이전트입니다. 시스템 프롬프트(지침)를 통해 자기 정체성, 인프라 정책, SCOPE 가드레일을 인식하고, 그다음에 SKILL.md를 직접 읽으며 글쓰기 룰을 따라갑니다. 작업이 끝나면 git commit + push를 본인이 직접 수행하고요.

**SKILL.md — 매뉴얼**

레포 안의 마크다운 파일입니다. 자동 로드되지 않고, Claude가 *필요할 때 직접 읽는* 문서예요. frontmatter 스키마, 카테고리 분류 가이드, 본문 톤·구조, slug 규칙, 커밋 컨벤션이 한 곳에 정리되어 있습니다.

<!-- 여기에 세 컴포넌트의 책임 다이어그램 삽입 (예: public/images/posts/idea-capture-bot/idea-bot-system-overview/components.png) -->

처음에는 이걸 두 층으로 묶어보려고도 시도했었어요. "Worker가 작업자 역할까지 하면 어떨까", "지침과 SKILL.md가 합쳐져도 되지 않나" 같은 식으로요. 그런데 막상 만들어 보니 *섞이는 순간 디버깅이 갑자기 어려워지더라고요*. 분리해 두면 한 부분만 독립적으로 수정·교체할 수 있고, 한 부분이 망가져도 다른 부분이 살아있다는 안정감이 있었습니다.

## 라우터-작업자-매뉴얼 패턴의 의외의 함정

분리 자체는 깔끔한데, 실제로 운영해 보니 *컴포넌트 사이의 인증·시그니처가 양방향으로 매칭되어야 한다*는 점을 처음에 자주 놓쳤어요.

예를 들어 `ROUTINE_TOKEN` 같은 HMAC 시크릿은 Worker 쪽과 Claude Code Routine 쪽이 *정확히 같은 값*을 들고 있어야 검증을 통과합니다. 한쪽만 갱신하면 401이 떨어지는데, 이걸 처음 디버깅할 때는 "Worker 코드가 잘못됐나? 텔레그램 webhook이 깨졌나?" 하면서 엉뚱한 곳을 한참 들여다봤습니다.

이런 경험이 쌓이고 나니 *느슨한 결합* 자체가 자동으로 좋은 시스템을 만들어 주지는 않더라고요. 결합을 느슨하게 하면 양쪽이 *합의한 계약*에 의존하기 시작하고, 그 계약(시크릿, webhook URL 형식, 메시지 스키마 등)을 양쪽 모두에서 동기화해야 합니다. 이걸 인지한 다음부터는 시크릿을 갱신할 때 항상 *양쪽을 한 번에 바꾸는 체크리스트*를 머릿속에 두고 작업하게 됐어요.

## 다음 6편에서 다룰 것

이번 글은 큰 그림과 컴포넌트 분리까지만 정리했습니다. 시리즈에서 이어지는 결정들은 다음과 같아요.

- **결정 1** — 단일 봇 prefix 라우팅이 아닌 별도 봇으로 나눈 이유
- **결정 2** — Worker를 GitHub repo 연결이 아니라 대시보드에서 직접 deploy한 이유
- **결정 3** — 지침과 SKILL.md를 가르는 휴리스틱 한 줄
- **결정 4** — "수정해줘" 사고를 막은 SCOPE 가드레일
- **결정 5+6** — 자동 push와 커밋 컨벤션이 알림 메타라인까지 만든 흐름
- **결정 7** — push와 workflow_run을 분리해 만든 알림 3단계

각 결정은 처음에 다른 선택지로 갔다가 *되돌려 본 경험*이 있어서, 시리즈를 따라 읽으면 "왜 처음에는 그 선택이 안 됐고, 결국 이 선택으로 정착했는지"가 자연스럽게 이어질 거예요. 다음 글에서 이어가겠습니다.
