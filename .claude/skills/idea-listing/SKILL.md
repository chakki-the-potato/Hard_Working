---
name: idea-listing
description: 텔레그램 또는 Claude Code에서 받은 러프한 아이디어를 분석해 src/data/ideas/{slug}.md 파일을 만들고 main에 커밋한다. 관련 외부 자료, 기존 블로그 중 유사 글, 발전 방향 피드백을 함께 작성한다. 메시지가 "아이디어:" 또는 "idea:" prefix로 시작하거나, Claude Code에서 명시적으로 idea-listing을 호출했을 때 사용.
---

# Idea Listing Skill

이 스킬은 사용자가 떠올린 러프한 아이디어를 받아 `/ideas/` 페이지에 노출되는 마크다운 파일을 생성하고 레포에 커밋한다.

`blog-draft` 스킬이 정식 블로그 초안을 만든다면, 이 스킬은 그 전 단계 — "정리되지 않은 아이디어 메모"를 다룬다.

## 입력

두 경로로 들어온다.

### 1. 텔레그램 봇

트리거 페이로드의 `text` 필드. `아이디어:` 또는 `idea:` prefix로 시작하는 메시지가 이 스킬로 라우팅된다.

예시:
- `아이디어: TypeScript 4.9 satisfies 연산자 정리`
- `idea: 사이드 프로젝트로 만든 도구를 oss로 푸는 시점 판단`
- `아이디어: 디자인 시스템 토큰 네이밍 컨벤션`

### 2. Claude Code 직접 호출

사용자가 터미널에서 자연어로 호출한다. prefix는 없어도 됨.

예시:
- "아이디어 추가해줘: React Server Components 핵심만"
- "/idea-listing Docker 멀티스테이지 빌드"

## 작업 흐름

1. **입력 분석** — prefix 제거 후 본문 추출. 너무 짧거나(2자 이하) 모호하면("ㅎㅇ", "ㅋ" 등) 작업 중단
2. **카테고리 결정** — Programming / Thinking / Design 중 하나. blog-draft와 동일 분류 기준
3. **slug 생성** — 영문 소문자 + 하이픈. 충돌 시 `-2`, `-3`
4. **유사한 이전 블로그 글 검색** — `src/data/blog/`에서 frontmatter `title`·`tags` 기준 매칭. 상위 1~3개 추출 (`rg` 사용 권장)
5. **외부 자료 조사** — `WebSearch` 0~3회. 라이브러리/도구/최신 트렌드면 검색, 일반 개념이면 생략
6. **피드백 작성** — 아이디어를 더 흥미롭게/구체적으로 만들 방향 1~3개 제시
7. **파일 작성** — `src/data/ideas/{slug}.md` 생성
8. **커밋** — `idea: {title}` 메시지로 main 브랜치 직접 커밋. 푸시는 사용자가 수동으로 함

## Frontmatter 스키마

`src/content.config.ts`의 `ideas` 컬렉션 Zod 스키마와 정확히 일치해야 빌드 통과.

```yaml
---
title: "아이디어 한 줄"
pubDate: 2026-04-26
tags: ["Programming", "TypeScript"]
---
```

### 필드별 규칙

- `title`: 15~50자. 한 줄 아이디어. 큰따옴표 필수. 콜론 포함 시 따옴표 안 그대로
- `pubDate`: 한국 시간 기준 오늘 날짜 (`YYYY-MM-DD`)
- `tags`: 첫 번째는 반드시 카테고리(Programming / Thinking / Design 중 하나). 그 뒤 1~2개 세부 태그. 첫 글자 대문자

## 카테고리 분류 가이드

blog-draft와 동일.

- **Programming**: 코드, 프레임워크, 라이브러리, 알고리즘, 시스템 설계, 도구 사용법
- **Thinking**: 학습 방법, 커리어, 의사결정, 회고, 생각 정리, 책/강의 후기
- **Design**: UI/UX, 타이포그래피, 색감, 디자인 시스템, 사용자 경험

## 파일 경로 규칙

```
src/data/ideas/{slug}.md
```

- 평평한 구조: 하위 폴더 사용 안 함
- 파일명에 날짜 prefix 없음
- slug는 영문 hyphenated (예: `satisfies-operator`, `oss-release-timing`)
- 동일 slug 존재 시 `-2`, `-3` 등 숫자 붙이기

## 본문 작성 스타일

블로그 본문보다 훨씬 짧고 가볍게. "메모"의 톤.

### 구조

```markdown
{1~3문장 idea body — 무엇이고 왜 흥미로운지}

## 관련 자료
- [제목](URL) — 한줄 설명
- [제목](URL) — 한줄 설명

## 유사한 이전 글
- [블로그 제목](/Hard_Working/posts/{slug}/) — 어떤 점이 겹치는지
- [블로그 제목](/Hard_Working/posts/{slug}/) — 어떤 점이 겹치는지

## 피드백 / 더 발전시킨다면
- 발전 방향 1
- 발전 방향 2
```

### 섹션 규칙

- **본문(섹션 헤더 없음)**: 1~3문장. 아이디어 자체를 풀어 씀. 너무 길면 안 됨 — "러프 메모"라는 본질 유지
- **관련 자료**: 외부 링크. 자료가 없으면 섹션 통째로 생략
- **유사한 이전 글**: 같은 블로그 내 글. 매칭되는 글이 없으면 섹션 통째로 생략. 링크는 `/Hard_Working/posts/{slug}/` 형식 (base URL 포함)
- **피드백 / 더 발전시킨다면**: 항상 1~3개 작성. 이 섹션이 가장 중요 — 사용자가 아이디어를 다듬는 데 실제로 도움이 되어야 함

### 톤

- 존댓말 ("~합니다", "~입니다") — 블로그와 동일
- 군더더기 없이 핵심만
- 1인칭은 사용하지 않음
- 추측은 추측이라고 명시 ("~일 가능성", "~로 보입니다")

## 유사 글 검색 가이드

`src/data/blog/` 디렉토리의 모든 `.md` 파일에서:

1. 아이디어의 핵심 키워드(2~3개)로 frontmatter `title` grep
2. 카테고리/태그가 일치하는 글 우선
3. 본문에서도 키워드 검색 (`rg -l "키워드" src/data/blog/`)
4. 상위 1~3개만 선정. 약하게 매칭되는 건 차라리 섹션 생략

링크 형식 검증:
- 파일명이 `foo-bar.md` → `/Hard_Working/posts/foo-bar/`
- 절대 `/posts/foo-bar/`로 쓰지 말 것 (base URL 빠지면 깨짐)

## 외부 자료 조사 가이드

- 검색은 0~3회. 많으면 본질에서 멀어짐
- 검색이 필요한 경우: 특정 라이브러리·도구·API·최신 변경사항
- 검색이 불필요한 경우: 일반 개념(자료구조, 디자인 패턴 등)
- 결과 링크는 공식 문서·신뢰할 만한 출처 우선
- 검색 결과가 빈약하면 섹션 통째로 생략

## 커밋 컨벤션

```
idea: {title}

via telegram-bot
```

또는 Claude Code 호출 시:

```
idea: {title}
```

- 제목 부분은 frontmatter의 `title` 그대로
- 한 번에 하나의 아이디어만 커밋
- main 브랜치에 직접 커밋 (브랜치 분기, PR 사용 안 함)
- 푸시는 사용자가 수동으로 — Claude는 푸시하지 않음

## 실패 시 행동

다음 상황에서는 작업 중단하고 명확한 에러 반환:

- 메시지가 너무 짧거나 모호함 ("ㅎㅇ", "ㅋ", 단어 1개만 등)
- 동일 slug 파일이 이미 3개 이상
- frontmatter 스키마 위반 발견

부분 실패(WebSearch 1회 실패, 유사 글 검색 0건 등)는 무시하고 진행. 해당 섹션만 생략.

## 작업 완료 시 출력

- 생성 파일 경로
- frontmatter의 `title`
- 커밋 SHA
- 배포 후 예상 URL: `https://chakki-the-potato.github.io/Hard_Working/ideas/`

## 작업하지 않을 것

- 정식 블로그 초안 작성 — 그건 `blog-draft` 스킬의 역할
- 이미지 생성/검색
- frontmatter의 `draft`, `updatedDate` 등 추가 필드 (명시적 요청 없으면)
- 기존 아이디어 수정 (덮어쓰기 위험)
- 여러 아이디어 동시 작성
- `git push` (사용자가 수동)
