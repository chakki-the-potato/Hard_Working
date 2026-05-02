---
title: "Blog Draft Bot — 시스템 개요와 9단계 파이프라인"
description: "폰 텔레그램에 메시지 한 통을 던지면 30초 안에 블로그 본문이 게시되는 시스템. 자매 Idea Capture Bot의 인프라를 더 무거운 작업으로 확장한 9단계 흐름과 5편 결정 미리보기를 6편 시리즈의 첫 글로 정리합니다."
pubDate: 2026-05-02T16:00:00+09:00
category: works
tags: ["Cloudflare Worker", "Claude Code"]
project: "blog-draft-bot"
repoUrl: "https://github.com/chakki-the-potato/Hard_Working"
role: "Solo developer"
period: "2026.04 ~"
version: "v1.0"
---

<!-- HERO 이미지 추가 시:
     1. public/images/posts/blog-draft-bot/blog-draft-bot-system-overview/hero.png 파일 업로드
     2. frontmatter에 heroImage: "/Hard_Working/images/posts/blog-draft-bot/blog-draft-bot-system-overview/hero.png" 추가
     3. 이 주석 삭제 -->

폰의 텔레그램 봇에 "이 주제로 글 써줘"라고 던지면, 30초에서 수분 안에 GitHub Pages 블로그의 `/posts/works/` 섹션에 본문이 게시됩니다. 짧은 메모를 저장하는 Idea Capture Bot과 달리, 이쪽은 *풀 본문을 작성해서 직접 올리는* 더 무거운 작업이에요.

이번 글은 시스템의 큰 그림과 9단계 파이프라인을 정리하는 시리즈의 첫 편입니다. 실제로 설계하면서 마주친 결정 5개는 이어지는 5편에서 한 편씩 다룰 예정이에요.

## 9단계 파이프라인 한눈에

전체 흐름은 이렇습니다.

```text
① 폰 텔레그램 (Blog Draft Bot)
   ↓ webhook (secret_token 헤더)
② Cloudflare Worker (blog-agent-proxy)
   ├─ secret_token 1차 검증
   ├─ ALLOWED_CHAT_ID 확인
   └─ 즉시 ack → Routine 호출 (HMAC 서명)
③ Claude Code Routine (blog-draft-agent)
   ├─ SKILL.md 로드
   ├─ 주제 분석 + slug 생성
   ├─ frontmatter + 본문 작성
   └─ git commit + push to main
④ GitHub Actions 빌드 트리거
   ↓ workflow_run webhook (GITHUB_WEBHOOK_SECRET)
⑤ Cloudflare Worker
   └─ 텔레그램으로 완료 알림 전송
   ↓
⑥ Astro 빌드 → GitHub Pages 게시
```

<!-- 여기에 시스템 아키텍처 다이어그램 삽입 (예: public/images/posts/blog-draft-bot/blog-draft-bot-system-overview/architecture.png) -->

Cloudflare Worker, Claude Code Routine, 블로그 레포 세 시스템이 webhook으로 느슨하게 연결된 구조입니다. 핵심은 *맥북이 꺼져 있어도 파이프라인이 돌아간다*는 점이에요. Routine이 Anthropic 클라우드에서 실행되고, Worker가 Cloudflare 엣지에서 24시간 떠있으니까 로컬 머신 의존도가 0입니다.

## 모바일 only로 가둔 이유

처음부터 *모바일에서만 트리거되는* 구조로 설계했어요. 책상에 앉아 있으면 Claude Code를 직접 열면 되는데, Blog Draft Bot이 필요한 순간은 *맥북이 없거나 켜기 귀찮은 상황*입니다. 이동 중에 주제가 떠올랐을 때, 자기 전에 메모를 글로 바꾸고 싶을 때처럼요.

"모바일 only"를 의도적으로 고정하면 기기 제약이 사라집니다. 파이프라인 전체를 "맥북 없이도 완성되어야 한다"는 기준으로 설계할 수 있었고, 그 덕분에 Cloudflare Workers + Anthropic 클라우드 조합이 자연스러운 선택이 됐어요.

## Idea Capture Bot과의 자매 관계

Blog Draft Bot은 [Idea Capture Bot](/Hard_Working/posts/works/idea-bot-system-overview/)이 쓰는 인프라 패턴을 그대로 물려받았습니다.

- Cloudflare Worker가 webhook 라우터 역할
- Claude Code Routine이 작업 에이전트 역할
- SKILL.md가 작업 매뉴얼 역할

차이는 *작업 무게*예요. Idea Capture Bot은 짧은 아이디어 메모를 `/ideas/` 섹션에 빠르게 저장하는 쪽이고, Blog Draft Bot은 풀 본문을 작성해서 `/posts/works/` 섹션에 올립니다. 같은 인프라 패턴을 더 무거운 작업으로 확장했을 때 무엇이 달라지는지가 이 시리즈의 핵심 주제이기도 해요.

<!-- 여기에 자매 비교 도식 삽입 (예: public/images/posts/blog-draft-bot/blog-draft-bot-system-overview/comparison.png) -->

## 다음 5편에서 다룰 결정

이번 글은 큰 그림까지만 정리했습니다. 시리즈에서 이어지는 결정들은 다음과 같아요.

- **결정 1** — Railway+FastAPI에서 Cloudflare Workers + Routine으로 피봇한 이유
- **결정 2** — Claude Code Routine을 골랐고 raw API는 Phase A로 미뤄둔 이유
- **결정 3** — 글쓰기 환경 세팅 — 디자인 토큰 먼저 잡고 SKILL.md로 흐름을 고정한 이유
- **결정 4** — claude/* 임시 브랜치를 두고 main에 직접 push하는 이유
- **결정 5** — HMAC 양방향 검증과 Telegram secret_token 이중 인증으로 webhook을 단단히 묶은 법

각 결정은 처음에 다른 선택지로 갔다가 *실제 제약에 맞닥뜨려 방향을 바꾼* 경험이 담겨 있어요. 시리즈를 따라 읽으면 "왜 처음 안이 안 됐고, 결국 이 선택으로 정착했는지"가 자연스럽게 이어질 겁니다. 다음 글에서 이어가겠습니다.
