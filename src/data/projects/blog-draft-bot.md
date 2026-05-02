---
title: "Blog Draft Bot"
summary: "텔레그램 메시지 한 통이 30초 안에 GitHub Pages 블로그 본문으로 게시되는 모바일-only 자동 초안 작성 파이프라인"
status: active
period: "2026.04 ~"
repoUrl: "https://github.com/chakki-the-potato/Hard_Working"
primaryCategory: works
order: 2
tags: ["Cloudflare Worker", "Claude Code", "Telegram"]
---

## 시리즈 구성

이 프로젝트는 시스템 개요 1편 + 결정별 5편, 총 **6편의 글**로 쪼개 두었습니다. 각 결정의 트레이드오프와 운영 중 발견한 깨달음을 짧은 글로 나눠 풀어가는 빌드로그 형식입니다.

1. **시스템 개요와 9단계 파이프라인** — 모바일 only 운영의 의미, 자매 Idea Bot과의 관계
2. **결정 1** — Railway+FastAPI에서 Cloudflare Workers + Routine으로 피봇한 이유
3. **결정 2** — Claude Code Routine을 골랐고 raw API는 Phase A로 미뤘던 이유
4. **결정 3** — 글쓰기 환경 세팅 — 디자인 토큰 먼저 잡고 SKILL.md로 흐름을 고정한 이유
5. **결정 4** — claude/* 임시 브랜치를 두고 main에 직접 push하는 이유
6. **결정 5** — HMAC 양방향 검증과 Telegram secret_token 이중 인증으로 webhook을 단단히 묶은 법

## 한 줄 요약

라우터(Cloudflare Worker)·작업자(Claude Code Routine)·매뉴얼(SKILL.md)의 세 층을 그대로 유지하면서, *더 긴 글을 더 정교하게* 쓰는 작업에 같은 인프라를 재사용했습니다. 핸드폰 하나로 전체 파이프라인이 돌아가는 게 이 시스템의 핵심입니다.
