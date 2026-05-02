---
title: "결정 4 — claude/* 임시 브랜치를 두고 main에 직접 push하는 이유"
description: "PR 거쳐 main에 머지하는 정석 흐름이 자동화에서는 거꾸로 갔습니다. Claude Code Routine 컨테이너의 휘발성 때문에 임시 브랜치를 추적할 주체가 없고, main 직접 push가 임시 브랜치 자연 소멸 패턴으로 가장 깔끔했어요."
pubDate: 2026-05-02T16:05:30+09:00
category: works
tags: ["Git", "Claude Code"]
project: "blog-draft-bot"
repoUrl: "https://github.com/chakki-the-potato/Hard_Working"
role: "Solo developer"
period: "2026.04 ~"
version: "v1.0"
---

<!-- HERO 이미지 추가 시:
     1. public/images/posts/blog-draft-bot/blog-draft-bot-decision-direct-main-push/hero.png 파일 업로드
     2. frontmatter에 heroImage: "/Hard_Working/images/posts/blog-draft-bot/blog-draft-bot-decision-direct-main-push/hero.png" 추가
     3. 이 주석 삭제 -->

일반적으로는 PR 거쳐 main에 머지합니다. 그런데 자동화 환경에서는 이 정석이 잘 맞지 않았어요.

## 처음 안 — claude/* 브랜치 + PR + main 머지

처음에 우려한 건 Claude Code Routine이 실수로 문제 있는 내용을 main에 바로 올릴 경우였어요. 그래서 Routine이 작성 완료 후 `claude/작업명` 브랜치에 커밋하고, 사람이 PR을 검토해서 main에 머지하는 흐름을 생각했습니다.

## 컨테이너 휘발성이 만든 문제

Claude Code Routine은 매 호출마다 새 컨테이너에서 실행돼요. 이전 호출의 브랜치나 작업 상태가 남아있지 않습니다. 컨테이너가 작업을 마치면 모든 로컬 상태가 사라지고, 다음 호출은 완전히 새로운 환경에서 시작하죠.

이 구조에서는 `claude/xxx` 브랜치를 만들어봤자 그 브랜치를 추적하거나 관리할 주체가 없어요. 브랜치가 GitHub에 쌓이기만 하고 자동으로 정리되지 않습니다.

<!-- 여기에 브랜치 라이프사이클 비교 다이어그램 삽입 (예: public/images/posts/blog-draft-bot/blog-draft-bot-decision-direct-main-push/branch-lifecycle.png) -->

## main 직접 push, claude/* 자연 소멸 패턴

결국 main 직접 push로 정착했어요. Routine은 작업 중에 내부적으로 임시 브랜치를 만들 수 있는데, main push 성공 후 컨테이너와 함께 사라집니다. GitHub에 쌓이지 않아요.

처음 운영할 때 Phase D 첫 실행에서 이 컨테이너 휘발성을 직접 경험했습니다. 디버깅 라운드 중에 컨테이너가 내려가고 작성 중이던 글이 사라졌어요. 그 이후 "컨테이너는 휘발하니까 main에 push가 완료되어야 작업이 완성"이라는 기준이 생겼습니다.

## 정리

자동화 에이전트는 사람과 다른 *수명*을 가집니다. 사람이 쓰는 브랜치 전략을 그대로 적용했을 때 맞지 않았던 건 에이전트의 수명 모델이 달랐기 때문이에요. 다음 글에서는 webhook 보안을 어떻게 설계했는지를 다뤄보겠습니다.
