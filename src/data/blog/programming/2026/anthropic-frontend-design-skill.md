---
title: "Claude가 만드는 UI가 다 비슷해 보인다면: anthropics/skills frontend-design"
description: "AI가 생성하는 UI의 범용적 미학을 깨뜨리는 frontend-design 스킬 — 타이포그래피, 색채, 모션, 레이아웃 구성에 대한 미적 원칙과 실제 동작 방식을 정리했습니다."
pubDate: 2026-05-04T11:01:24+09:00
category: programming
tags: ["Tools"]
version: "v1.0"
---

Claude에게 UI를 만들어달라고 하면 비슷한 결과물이 나오는 경우가 많습니다. Inter 폰트, 연보라색 그래디언트, 예측 가능한 카드 레이아웃. 충분히 작동하지만 기억에 남지 않습니다. [anthropics/skills의 frontend-design 스킬](https://github.com/anthropics/skills/blob/main/skills/frontend-design)은 이 패턴을 깨기 위해 만들어졌습니다.

## 스킬이 해결하는 문제

기본 상태의 Claude는 UI를 요청받으면 안전한 선택을 합니다. 검증된 패턴, 무난한 폰트, 범용적인 색상. 이걸 스킬 문서에서는 "generic AI slop aesthetics"라고 부릅니다.

frontend-design 스킬은 코딩에 앞서 **미적 방향을 먼저 결정**하도록 강제합니다. 단순히 컴포넌트를 구현하는 것이 아니라, 이 인터페이스가 어떤 맥락에서 누구를 위한 것인지 이해하고, 그에 맞는 구체적인 방향을 선택하고, 그걸 끝까지 일관되게 밀어붙이는 방식입니다.

## 설치 방법

```bash
claude plugins install frontend-design
```

설치 후 `/frontend-design:frontend-design`으로 호출합니다. HTML/CSS/JS, React, Vue 등 어떤 스택에도 적용됩니다.

## 작동 방식

스킬은 구현 전에 네 가지 질문을 먼저 답하게 합니다.

**목적**: 이 인터페이스가 해결하는 문제는 무엇인가? 누가 쓰는가?  
**톤**: 어떤 미적 방향인가? Brutally minimal, maximalist chaos, retro-futuristic, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric 등 구체적인 방향을 선택합니다.  
**제약**: 프레임워크, 성능, 접근성 요구사항은?  
**차별점**: 이 UI에서 한 가지를 기억한다면 무엇인가?

방향이 결정되면 그 방향을 실제로 코드에 반영합니다.

## 미적 원칙

**타이포그래피**

Inter, Roboto, Arial은 금지 목록입니다. 용도에 맞는 독특한 서체를 선택하고, 디스플레이 폰트와 본문 폰트를 대비 있게 페어링합니다.

**색채**

CSS 변수로 일관된 팔레트를 구성합니다. 균등하게 배분된 색상보다 주 색상 + 날카로운 포인트 컬러 조합이 더 효과적입니다. 연보라 그래디언트는 피합니다.

**모션**

페이지 로드 시 잘 설계된 단 하나의 스태거드 리빌 애니메이션이, 분산된 마이크로인터랙션 열 개보다 낫습니다. CSS-only 우선이고, React 환경에서는 Motion 라이브러리를 활용합니다.

**레이아웃**

비대칭, 겹침, 대각선 흐름, 그리드를 벗어나는 요소. 예측 가능한 카드 나열 대신 공간을 극적으로 사용합니다.

**배경 · 디테일**

단색 배경 대신 분위기를 만듭니다. 그래디언트 메쉬, 노이즈 텍스처, 기하학 패턴, 레이어드 투명도, 그레인 오버레이 등을 맥락에 맞게 씁니다.

## 스킬이 강조하는 것

스킬 문서에서 반복해서 나오는 표현이 있습니다.

> "Bold maximalism and refined minimalism both work — the key is intentionality, not intensity."

방향 자체보다 방향을 선택했으면 끝까지 그 방향을 실행하는 것이 중요하다는 의미입니다. 맥시멀리즘을 선택했으면 애니메이션도, 디테일도, 코드도 맥시멀하게 작성합니다. 미니멀리즘을 선택했으면 여백과 타이포그래피와 미묘한 디테일에 집중합니다.

## 어떤 경우에 쓰는가

랜딩 페이지, 대시보드, 마케팅 섹션처럼 디자인이 실제로 중요한 컴포넌트를 만들 때 씁니다. 내부 관리자 화면이나 간단한 폼 같은 경우엔 오버스펙입니다.

"그냥 기본적인 UI 만들어줘"라고 할 때는 필요 없지만, "기억에 남는 UI 만들어줘"라고 할 때는 이 스킬을 먼저 호출하는 것이 맞습니다.

## 참고 자료

- GitHub: https://github.com/anthropics/skills/tree/main/skills/frontend-design
