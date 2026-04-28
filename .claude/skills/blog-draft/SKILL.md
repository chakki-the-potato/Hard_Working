---
name: blog-draft
description: 텔레그램에서 받은 메시지를 분석하여 Hard_Working 블로그의 초안 마크다운 파일을 작성하고 main 브랜치에 커밋한다. 필요 시 웹 조사를 수행한다.
---

# Blog Draft Skill

이 스킬은 사용자가 텔레그램으로 보낸 주제를 받아 블로그 초안을 생성하고 레포에 커밋하는 작업을 수행한다.

> 메시지가 `아이디어:` 또는 `idea:` prefix로 시작하면 이 스킬 대신 `idea-listing` 스킬이 처리한다.

## 입력

트리거 페이로드의 `text` 필드에 사용자가 작성한 텔레그램 메시지 텍스트가 들어 있다.

메시지 형식 예시:
- 단순 주제: "Docker 멀티스테이지 빌드"
- 주제 + 개요: "TypeScript의 satisfies 연산자, type assertion과 차이점 위주로"
- 주제 + 메모: "오늘 본 React Server Components, 핵심만"

## 작업 흐름

1. 메시지 분석 — 주제, 글의 방향, 사용자가 제공한 정보 파악
2. 카테고리 결정 — `programming` / `thinking` / `design` 중 하나 (소문자)
3. 조사 판단 — 충분한 정보가 있으면 생략. 최신 정보가 필요하면 웹 검색 (2~4회)
4. slug 생성 — 영문 소문자, 단어 사이 하이픈
5. 현재 KST 시각 확인 — Bash로 두 값을 동시에 추출:
   - `pubDate`용: `TZ=Asia/Seoul date '+%Y-%m-%dT%H:%M:%S+09:00'`
   - 폴더명용 연도: `TZ=Asia/Seoul date '+%Y'`
6. frontmatter + 본문 작성 — 아래 규칙 엄수
7. 파일 저장 — `src/data/blog/{category}/{year}/{slug}.md`. 카테고리 폴더가 없으면 새로 생성
8. 커밋 + 푸시 — main 브랜치 직접 푸시

## Frontmatter 스키마 (절대 어기지 말 것)

`src/content.config.ts`의 Zod 스키마와 정확히 일치해야 빌드 통과.

```yaml
---
title: "글의 제목"
description: "1~2문장 요약, SEO용"
pubDate: 2026-04-25T14:32:08+09:00
category: programming
tags: ["Backend"]
---
```

### 필드별 규칙

- title: 30~60자. 큰따옴표로 감싸기. 콜론 포함 시 따옴표 필수
- description: 80~150자. 글의 핵심 1~2문장. SEO 메타로도 사용
- pubDate: 한국 시간 기준 현재 시각 (`YYYY-MM-DDTHH:mm:ss+09:00`). 작업 흐름 5단계의 `TZ=Asia/Seoul date` 출력을 그대로 사용. 같은 날 여러 글이 등록될 때 시:분:초로 등록 순서를 구분하기 위함
- category: **필수 필드**. `programming` / `design` / `thinking` 중 하나 (소문자). enum 미스매치 시 빌드 실패. 폴더 경로의 카테고리와 반드시 동일해야 함
- tags: 카테고리와 별개의 자유 라벨. 영문, 첫 글자 대문자, 0~3개. 예: `["Backend"]`, `["Build Tools", "Caching"]`. 비워도 OK

### works 카테고리 전용 optional 메타

`category: works`인 경우에만 의미가 있는 선택 필드. PostLayout이 이 값들을 메타 블록으로 렌더링한다. 다른 카테고리 글에서는 사용하지 않는다.

- `demoUrl`: 배포된 데모 URL (https://...)
- `repoUrl`: GitHub/GitLab 등 저장소 URL
- `role`: 본인 역할 (예: "Solo developer", "PM·Frontend")
- `period`: 진행 기간 (예: "2025.11 ~ 2026.02")
- `outcome`: 성과·결과 (예: "수상 X 본선 진출", "MAU 300")

비워도 됨. 하나 이상 채우면 글 상단에 메타 블록으로 노출.

### 카테고리 분류 가이드

자동 분류는 3종만 사용:

- `programming`: 코드, 프레임워크, 라이브러리, 알고리즘, 시스템 설계, CLI·에디터·워크플로우 자동화 등 도구 사용기까지 포함
- `thinking`: 학습 방법, 커리어, 의사결정, 회고, 생각 정리, 책/강의 후기
- `design`: UI/UX, 타이포그래피, 색감, 디자인 시스템, 사용자 경험

> `tools`, `works` enum 값도 스키마상 유효하지만 자동 라우팅에서는 사용하지 않는다.
> - `tools`: 사용자가 "tools 카테고리로" 같이 명시할 때만 예외적으로 사용
> - `works`: 프로젝트·자체 제작 에이전트·공모전 출품작 등 "만든 결과물" 전용. 사용자가 "works 카테고리로", "프로젝트", "공모전", "에이전트 만든 거" 같이 명시할 때만 사용. works 글은 폴더 `src/data/blog/works/{year}/{slug}.md`에 저장하고, 가능하면 demoUrl·repoUrl·role·period·outcome 메타도 함께 채운다.

## 파일 경로 규칙

```
src/data/blog/{category}/{year}/{slug}.md
```

- `{category}`는 frontmatter `category` 값과 반드시 동일
- `{year}`는 현재 KST 연도 (`TZ=Asia/Seoul date '+%Y'`). pubDate를 거꾸로 파싱하지 않음
- 카테고리/연도 폴더가 없으면 새로 생성
- 파일명에 날짜 prefix 없음
- slug는 영문 hyphenated (예: `langgraph-checkpointer`, `docker-multi-stage-build`)
- slug 충돌 검사는 동일 카테고리 폴더 안에서만 수행. 다른 카테고리에 같은 slug가 있어도 OK (public id가 `{category}/{slug}`라 충돌 아님)
- 동일 카테고리 내 충돌 시 `-2`, `-3` 등 숫자 붙이기

## 본문 작성 스타일

기존 블로그의 톤을 따른다.

### 톤
- 존댓말 ("~합니다", "~입니다")
- 간결한 정보 전달형. 군더더기 최소화
- 객관적 서술 위주. 1인칭 거의 사용 안 함

### 구조
1. 도입부: `##` 헤더 없이 2~5문장으로 글의 맥락/이유 제시
2. 본문: `##` 섹션 헤더로 3~6개 섹션 구조화
3. 하위 분류: 필요시 `###` 사용
4. 마무리: "주의사항", "팁", "참고 자료" 등 실전 정보로 끝맺기

### 적극 활용할 요소
- 표: 비교/분류 (Markdown 표)
- 코드 블록: 언어 태그 필수. Astro Shiki(`github-light`/`github-dark`)가 언어 토큰에 따라 자동 색을 입히므로, 정확한 alias를 사용해야 하이라이팅이 살아남
- 번호 목록: 단계별 절차나 우선순위
- 불릿: 병렬적 항목 나열

### 코드 블록 작성 규칙

Shiki가 색을 입히는 조건과 권장 사용법:

- **언어 태그 필수**: 빈 ` ``` `는 단색 회색으로 렌더되므로 절대 사용 안 함
- **권장 alias 목록** — Shiki 표준에 맞춰 일관 사용:
  - JavaScript: `js` (또는 `javascript`)
  - TypeScript: `ts` (또는 `typescript`)
  - JSX/TSX: `jsx`, `tsx`
  - Python: `python` (또는 `py`)
  - Shell: `bash` (sh, zsh 대신 bash 통일)
  - JSON: `json`
  - YAML: `yaml`
  - Markdown: `md`
  - HTML/CSS: `html`, `css`
  - SQL: `sql`
  - 출력/로그: `text` 또는 `console`
  - Diff: `diff`
- **분량**: 한 블록 5~20줄 권장. 30줄 넘으면 핵심만 발췌하고 `// ...` 로 생략
- **인라인 코드**: 함수명·변수명·짧은 명령은 백틱 1개(`` ` ``)로 강조 — 표나 본문에서 읽힘이 좋아짐
- **파일명/경로 표기**: 코드 블록 바로 위에 `**`경로`**` 형태로 한 줄 추가 (예: `**src/utils/date.ts**`)

### 분량
- 짧은 글: 800~1500자 (개념 정리, 팁)
- 중간 글: 1500~3000자 (실전 가이드)
- 한 글에 하나의 주제만

## 웹 조사 가이드

- 2~4번 검색 권장
- 최신성이 중요한 주제(라이브러리 버전, 가격, 정책)는 반드시 검색
- 일반 개념은 검색 없이 작성 가능
- 검색 결과는 자신의 말로 재구성. 직접 인용 최소화
- 출처 중요할 때만 본문 마지막에 "참고 자료" 섹션

## 커밋 컨벤션

```
draft: {글 제목}

via telegram-bot
```

- 제목 부분은 frontmatter의 title 그대로
- 한 번에 한 글만 커밋
- main 브랜치에 직접 푸시 (브랜치 분기, PR 사용 안 함)

## 실패 시 행동

다음 상황에서는 작업 중단하고 명확한 에러 반환:
- 메시지가 너무 짧거나 모호함 ("ㅎㅇ", "ㅋ" 등)
- 동일 slug 파일이 이미 3개 이상
- frontmatter 스키마 위반 발견

부분 실패(검색 한 번 실패 등)는 무시하고 진행.

## 작업 완료 시 출력

- 생성 파일 경로
- frontmatter의 title
- 커밋 SHA
- 배포 후 예상 URL: `https://chakki-the-potato.github.io/Hard_Working/posts/{category}/{slug}/`

## 작업하지 않을 것

- 글의 완벽한 마무리 — 초안까지만. 사용자가 직접 다듬음
- 이미지 생성/검색
- frontmatter의 `heroImage`, `draft`, `updatedDate` 추가 (명시적 요청 없으면)
- 기존 글 수정
- 여러 글 동시 작성