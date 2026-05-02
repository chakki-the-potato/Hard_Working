---
title: "Idea Capture Bot"
summary: "폰의 텔레그램 봇에 메모를 던지면 30초~1분 안에 GitHub Pages 블로그 /ideas/ 섹션에 자동 게시되는 개인 자동화 시스템"
status: active
period: "2026.04 ~"
repoUrl: "https://github.com/chakki-the-potato/Hard_Working"
primaryCategory: works
order: 1
tags: ["Cloudflare Worker", "Claude Code", "Telegram"]
---

## 시리즈 구성

이 프로젝트는 시스템 개요 1편 + 결정별 6편, 총 **7편의 글**로 쪼개 두었습니다. 각 결정의 트레이드오프와 운영 중 발견한 사고를 짧은 글로 나눠 풀어가는 빌드로그 형식입니다.

1. **시스템 개요와 컴포넌트 분리** — Worker · Routine · SKILL.md 3분할
2. **결정 1** — 단일 봇 prefix 라우팅 vs 별도 봇으로 나눈 이유
3. **결정 2** — Cloudflare Worker를 대시보드에서 직접 deploy한 이유
4. **결정 3** — 지침과 SKILL.md를 가르는 휴리스틱
5. **결정 4** — "수정해줘" 사고를 막은 SCOPE 가드레일
6. **결정 5+6** — 자동 push와 커밋 컨벤션으로 알림 메타라인까지
7. **결정 7** — push와 workflow_run을 분리해 만든 알림 3단계

## 한 줄 요약

라우터(Cloudflare Worker)·작업자(Claude Code Routine)·매뉴얼(SKILL.md)을 분리해 *각자의 책임만* 갖게 했습니다. 한 부분이 망가져도 다른 부분이 살아있고, 한 부분의 룰을 바꿔도 다른 부분에 영향이 없습니다.
