---
name: idea-listing
description: 텔레그램 또는 Claude Code에서 받은 러프한 아이디어를 분석해 src/data/ideas/{category}/{year}/{slug}.md 파일을 만들고 main에 커밋한다. `[ideas/...]` prefix가 있으면 카테고리 강제, 없으면 `아이디어:` / `idea:` prefix 또는 자연어로 자동 라우팅. 관련 외부 자료, 기존 블로그 중 유사 글, 발전 방향 피드백을 함께 작성한다.
---

# Idea Listing Skill

이 스킬은 사용자가 떠올린 러프한 아이디어를 받아 `/ideas/` 페이지에 노출되는 마크다운 파일을 생성하고 레포에 커밋한다.

`blog-draft` 스킬이 정식 블로그 초안을 만든다면, 이 스킬은 그 전 단계 — "정리되지 않은 아이디어 메모"를 다룬다. 두 스킬은 카테고리 enum, 톤 규칙, 클리셰 금지 룰을 공유한다.

## 입력 형식

트리거 페이로드의 `text` 필드에 사용자가 작성한 텔레그램 메시지 텍스트가 들어 있다 (또는 Claude Code 터미널에서 직접 호출). **prefix가 있으면 prefix 우선**, 없으면 자연어 자동 라우팅으로 폴백한다.

### 1. Prefix 양식 (권장)

| Prefix | 양식 |
|---|---|
| `[ideas/programming]` | `[ideas/programming] 한 줄 아이디어 — tag 후보` |
| `[ideas/design]` | `[ideas/design] 한 줄 아이디어` |
| `[ideas/thinking]` | `[ideas/thinking] 한 줄 아이디어 — 결론·관찰` |
| `[ideas/works]` | `[ideas/works] 한 줄 아이디어 — 만들 결과물 컨셉` |

prefix가 검출되면 **카테고리는 강제**되고, 자연어 분류 가이드는 적용하지 않는다.

### 2. 레거시 / 자연어 fallback

`[ideas/...]` prefix가 없는 경우 다음 순서로 라우팅한다.

- **레거시 prefix** — `아이디어:` 또는 `idea:` 로 시작하면 prefix를 떼고 본문만 추출한 뒤 자연어 분류기로 카테고리 판정
- **prefix 없음** — Claude Code 터미널에서 직접 호출했을 때처럼 자연어 그대로 분류

예시:

- `아이디어: TypeScript 4.9 satisfies 연산자 정리` → `programming`
- `idea: 사이드 프로젝트로 만든 도구를 oss로 푸는 시점 판단` → `thinking`
- `아이디어 추가해줘: React Server Components 핵심만` → `programming`
- `Docker 멀티스테이지 빌드` → `programming`

## 작업 흐름

1. **메시지 분석** — `[ideas/{category}]` → `아이디어:` / `idea:` → 자연어 순으로 prefix 검출. prefix가 있으면 카테고리 강제, 없으면 자연어 분류
2. **입력 길이·모호성 검사** — 2자 이하이거나 "ㅎㅇ", "ㅋ" 같이 의미 추출 불가하면 작업 중단하고 에러 반환
3. **카테고리 결정** — `programming` / `design` / `thinking` / `works` 중 하나 (4종, 소문자). 자연어 입력은 아래 "카테고리 분류 가이드" 참조
4. **현재 KST 날짜 확인** — Bash로 두 값을 동시에 추출:
   - `pubDate`용: `TZ=Asia/Seoul date '+%Y-%m-%d'`
   - 폴더명용 연도: `TZ=Asia/Seoul date '+%Y'`
5. **slug 생성** — 영문 소문자, 단어 사이 하이픈. 동일 카테고리 폴더 안에서만 충돌 검사
   - `works`이면 `{project-slug}/{detail-slug}` 형태로 생성 (아래 "works 폴더 구조" 참조)
5b. **버전 체크 (versioning)** — 동일 slug 파일이 이미 존재하는지 확인
   - 존재하면 **버전 업데이트 모드** 진입: 기존 파일을 수정하고 `version`을 올린다
     - 기존 `version` 없으면 `v1.0` → 이번 수정으로 `v1.1` 부여
     - 기존 `version: "v1.x"` 있으면 patch 숫자 +1 (v1.1 → v1.2)
     - `updatedDate`를 오늘 KST 날짜로 추가/갱신
   - 존재하지 않으면 **신규 파일 생성** 모드 (기존 흐름)
6. **양식 reference 로드** — `.claude/skills/idea-listing/templates/{category}.md`가 존재하면 본문 작성 전에 read (없으면 skip). 양식이 없을 때는 `src/data/ideas/{category}/**/*.md` 중 최근 파일 1~2편을 read해서 톤·길이를 흉내
7. **유사한 이전 블로그 글 검색** — `src/data/blog/**/*.md` (재귀)에서 frontmatter `title`·`tags` 기준 매칭. `rg`로 키워드 grep. 상위 1~3개 추출
8. **외부 자료 조사** — `WebSearch` 0~3회. 라이브러리·도구·최신 트렌드면 검색, 일반 개념이면 생략
9. **피드백 작성** — 아이디어를 더 흥미롭게·구체적으로 만들 방향 1~3개 제시
10. **파일 작성/수정**
    - 신규 생성: `src/data/ideas/{category}/{year}/{slug}.md` (works 제외). 폴더가 없으면 새로 생성
    - works 신규: `src/data/ideas/works/{project-slug}/{detail-slug}.md`
    - 버전 업데이트: 기존 파일 frontmatter의 `version` + `updatedDate` 수정, 본문 내용 보완
11. **커밋 + 푸시** — `idea({category}/{Tag1}): {title}` 메시지로 main 브랜치에 직접 커밋한 뒤 즉시 `git push origin main` 실행

## Frontmatter 스키마 (절대 어기지 말 것)

[src/content.config.ts](../../../src/content.config.ts)의 `ideas` 컬렉션 Zod 스키마와 정확히 일치해야 빌드 통과.

```yaml
---
title: "아이디어 한 줄"
pubDate: 2026-04-29
category: programming
tags: ["TypeScript"]
# 버전 관리 시에만 추가:
# version: "v1.0"
# updatedDate: 2026-04-30
---
```

### 필드별 규칙

- `title`: 15~50자. 한 줄 아이디어. 큰따옴표 필수. 콜론 포함 시 따옴표 안에 그대로
- `pubDate`: 한국 시간 기준 최초 작성 날짜 (`YYYY-MM-DD`). 버전 업데이트 시에도 변경하지 않음
- `updatedDate`: 버전 업데이트 시에만 추가. 오늘 KST 날짜 (`YYYY-MM-DD`). 신규 글이면 생략
- `category`: **필수 필드**. `programming` / `design` / `thinking` / `works` 중 하나 (소문자). enum 미스매치 시 빌드 실패. 폴더 경로의 카테고리와 반드시 동일
- `tags`: 카테고리와 별개의 자유 라벨. 영문, 첫 글자 대문자, 0~3개. 비워도 OK
- `version`: 버전 관리 시에만 추가. 형식 `"v1.0"` (따옴표 필수). 신규 글이면 생략. 처음 버전 업데이트가 발생하는 시점에 기존 파일에 `v1.0` → 이후 `v1.1`로 작성

### 추가하지 말 것

ideas 컬렉션 스키마는 다음 필드를 지원하지 않는다. frontmatter에 절대 넣지 않는다.

- `description` (blog 전용)
- `demoUrl` / `repoUrl` / `role` / `period` / `outcome` (blog의 works 전용 optional 메타)
- `heroImage` 등

works 카테고리 아이디어라도 위 메타 필드는 ideas frontmatter에 넣지 않고, 필요하면 본문에 평문으로 적는다.

## 카테고리 분류 가이드 (자연어 fallback용)

자동 분류 enum 4종. blog-draft와 정확히 동일하다.

- `programming`: 코드, 프레임워크, 라이브러리, 알고리즘, 시스템 설계, 언어 기능 등 "개념·구현"이 중심. **도구 사용기·CLI 설정·에디터 워크플로우도 여기에 포함**하며, 이 경우 `tags`에 `Tools`를 추가
- `design`: UI/UX, 타이포그래피, 색감, 디자인 시스템, 사용자 경험
- `thinking`: 학습 방법, 커리어, 의사결정, 회고, 생각 정리, 책·강의 후기
- `works`: 만들 결과물에 대한 러프 메모 (프로젝트 컨셉, 에이전트 아이디어, 공모전 출품 컨셉, 사이드 프로젝트 기획). 메시지에서 다음 신호 중 하나 이상이면 자동 라우팅:
  - "프로젝트", "공모전", "출품", "런칭", "출시", "에이전트 만들", "사이드 프로젝트" 같은 키워드
  - "~을 만들어볼까", "~ 기획" 같이 결과물을 빌드하려는 톤
  - ideas 컬렉션은 works optional 메타를 지원하지 않으므로, 카테고리만 works로 두고 본문에 평문으로 풀어 쓴다

> 사용자가 메시지에 "works 카테고리로" 같이 명시하면 자동 판단을 무시하고 명시한 카테고리를 사용한다.

### 분류 예시

| 메시지 | 카테고리 | tags | 이유 |
|---|---|---|---|
| "TypeScript satisfies 연산자" | `programming` | `["TypeScript"]` | 언어 기능 |
| "Docker 멀티스테이지 빌드" | `programming` | `["Docker"]` | 빌드 개념 |
| "Claude Code 슬래시 커맨드 정리" | `programming` | `["Tools"]` | 도구 사용기 → programming + Tools |
| "neovim LSP 설정" | `programming` | `["Tools"]` | 에디터 설정 |
| "tmux 워크플로우" | `programming` | `["Tools"]` | 도구 워크플로우 |
| "공모전 출품 에이전트 컨셉" | `works` | — | "공모전" 키워드 |
| "사이드 프로젝트로 OSS 만들어볼까" | `works` | — | 결과물 빌드 톤 |
| "OSS 공개 시점 판단" | `thinking` | — | 의사결정 |
| "다크모드 채도 토큰 네이밍" | `design` | — | 디자인 시스템 |

## 파일 경로 규칙

```
# programming / design / thinking
src/data/ideas/{category}/{year}/{slug}.md

# works — 프로젝트별 폴더
src/data/ideas/works/{project-slug}/{detail-slug}.md
```

### programming / design / thinking

- `{category}`는 frontmatter `category` 값과 반드시 동일
- `{year}`는 현재 KST 연도 (`TZ=Asia/Seoul date '+%Y'`). pubDate를 거꾸로 파싱하지 않음
- 카테고리·연도 폴더가 없으면 새로 생성
- 파일명에 날짜 prefix 없음
- slug는 영문 hyphenated (예: `satisfies-operator`, `oss-release-timing`)
- slug 충돌 검사는 동일 카테고리 폴더 안에서만 수행
- 동일 카테고리 내 충돌 시 `-2`, `-3` 등 숫자 붙이기

### works — 프로젝트별 폴더 구조

works 카테고리는 연도 폴더 대신 **프로젝트 슬러그 폴더**로 구분한다.

```
src/data/ideas/works/
  auto-work-tracking/
    overview.md       ← 프로젝트 개요 / 첫 메모
    tech-stack.md     ← 기술 선택 메모
    feature-ideas.md  ← 기능 아이디어 목록
  speaking-practice/
    overview.md
```

- `{project-slug}`: 프로젝트 이름을 hyphenated 영문 소문자로 (예: `auto-work-tracking`)
- `{detail-slug}`: 해당 메모의 세부 주제. 첫 메모라면 `overview` 권장
- 폴더가 없으면 새로 생성
- public id: `works/{project-slug}/{detail-slug}` → URL: `/ideas/works/{project-slug}/{detail-slug}/`
- works에 처음 올라오는 아이디어면 프로젝트 폴더와 `overview.md` 동시 생성
- 기존 `works/{year}/{slug}.md` 형식으로 쓴 파일은 하위 호환 유지 (`flattenYear`가 연도인지 자동 감지)

## 본문 작성 톤

블로그 본문보다 훨씬 짧고 가볍게. "메모"의 톤. 단, **경어체와 클리셰 금지 룰은 blog-draft와 동일**하다.

### 톤 규칙

- **경어체 일관** — `~합니다`, `~입니다`, `~로 보입니다`, `~일 가능성이 있습니다`. 평어체·문어체 금지
- **1인칭은 가급적 회피** — 메모 톤이라 "저는 ~합니다"보다 관찰·판단을 그대로 옮기는 쪽이 자연스러움. 회고 한두 문장은 1인칭 OK
- **추측은 추측이라고 명시** — `~로 보입니다`, `~일 가능성이 있습니다`, `~인 듯합니다`
- **군더더기 없이 핵심만** — 러프 메모라는 본질을 유지. 한 섹션이 너무 길어지면 블로그 초안으로 옮길 신호
- **AI 클리셰 금지** — "훌륭한 질문입니다", "정확하십니다", 빈 사과("혼란을 드려 죄송합니다"), 자기 내레이션 남발("이제 ~을 하겠습니다"), "AI로서·언어 모델로서" 자기언급
- **이모지 사용 금지**

### 참고 기준 글

매 글 작성 시 톤·길이·섹션 비중을 다음 순서로 참고한다.

- **1차 reference (양식)**: `.claude/skills/idea-listing/templates/{category}.md` — 사용자가 양식을 가져오면 같은 위치에 추가. 현재는 비어 있어도 됨
- **2차 reference (실제 발행본)**: `src/data/ideas/{category}/{year}/*.md`의 최근 파일 1~2편 (예: [src/data/ideas/thinking/2026/product-choice-beyond-performance.md](../../../src/data/ideas/thinking/2026/product-choice-beyond-performance.md))

## 본문 구조

```markdown
{1~3문장 idea body — 무엇이고 왜 흥미로운지}

## 관련 자료
- [제목](URL) — 한줄 설명
- [제목](URL) — 한줄 설명

## 유사한 이전 글
- [블로그 제목](/Hard_Working/posts/{category}/{slug}/) — 어떤 점이 겹치는지
- [블로그 제목](/Hard_Working/posts/{category}/{slug}/) — 어떤 점이 겹치는지

## 피드백 / 더 발전시킨다면
- 발전 방향 1
- 발전 방향 2
```

### 섹션 규칙

- **본문(섹션 헤더 없음)**: 1~3문장. 아이디어 자체를 풀어 씀. 너무 길면 안 됨 — "러프 메모"라는 본질 유지
- **관련 자료**: 외부 링크. 자료가 없으면 섹션 통째로 생략
- **유사한 이전 글**: 같은 블로그 내 글. 매칭되는 글이 없으면 섹션 통째로 생략. 링크는 `/Hard_Working/posts/{category}/{slug}/` 형식 (base URL 포함, post.id가 이미 `{category}/{slug}` 형태이므로 그대로 활용)
- **피드백 / 더 발전시킨다면**: 항상 1~3개 작성. **이 섹션이 가장 중요** — 사용자가 아이디어를 다듬는 데 실제로 도움이 되어야 함

### 카테고리별 가벼운 노트

- `programming`: 코드 블록을 쓸 일이 거의 없지만, 쓴다면 **언어 태그 필수** (` ```ts `, ` ```bash `). 빈 ` ``` `는 단색 회색이라 절대 사용 안 함
- `design`: 색·치수·간격 같은 구체 숫자 한두 개를 본문에 넣으면 메모가 풍성해짐 (예: "채도를 15~25% 낮추는 패턴")
- `thinking`: 1인칭 회피가 기본이지만, 1~2문장 회고는 OK. 단정보다 관찰·가설로 적기
- `works`: "만들 결과물 컨셉 + 가설" 위주. 메타(데모 URL·역할·기간)는 ideas 스키마가 지원하지 않으므로 본문에 평문으로 적고, 정식 발행 시 `[blog/works]`로 옮길 때 frontmatter로 승격

## 유사 글 검색 가이드

`src/data/blog/**/*.md` (재귀)에서:

1. 아이디어의 핵심 키워드(2~3개)로 frontmatter `title` grep
2. frontmatter `category` / `tags`가 일치하는 글 우선
3. 본문에서도 키워드 검색 (`rg -l "키워드" src/data/blog/`)
4. 상위 1~3개만 선정. 약하게 매칭되는 건 차라리 섹션 생략

링크 형식 검증:

- 파일 경로 `src/data/blog/programming/2026/foo-bar.md` → `/Hard_Working/posts/programming/foo-bar/`
- 즉, `{category}/{slug}` 부분만 떼어 base URL과 결합 (year는 URL에 들어가지 않음)
- 절대 `/posts/foo-bar/`나 `/posts/2026/foo-bar/`로 쓰지 말 것 (base URL 빠지거나 year가 URL에 새면 깨짐)

## 외부 자료 조사 가이드

- 검색은 0~3회. 많으면 본질에서 멀어짐
- 검색이 필요한 경우: 특정 라이브러리·도구·API·최신 변경사항
- 검색이 불필요한 경우: 일반 개념(자료구조, 디자인 패턴 등)
- 결과 링크는 공식 문서·신뢰할 만한 출처 우선
- 검색 결과가 빈약하면 섹션 통째로 생략

## 커밋 컨벤션

```
idea({category}/{Tag1}): {title}

via telegram-bot
```

또는 Claude Code 호출 시:

```
idea({category}/{Tag1}): {title}
```

규칙:
- `{category}`: frontmatter `category` 값 그대로 (소문자, programming/design/thinking/works 중 하나)
- `{Tag1}`: frontmatter `tags[0]` (있으면)
- `tags`가 비어 있으면 `idea({category}): {title}` 로 (괄호 유지)
- 제목 부분은 frontmatter의 `title` 그대로
- 한 번에 하나의 아이디어만 커밋
- main 브랜치에 직접 커밋 (브랜치 분기·PR 사용 안 함)
- **`git commit` 직후 자동으로 `git push origin main` 실행** — Claude가 push까지 책임진다

예시:
- `idea(programming/TypeScript): satisfies 연산자로 안전한 const`
- `idea(design): 다크 모드 채도 토큰 네이밍 패턴`
- `idea(thinking): OSS 공개 시점 판단 메모`
- `idea(works/Astro): 블로그 빌드로그 작성 컨셉`

이 컨벤션은 GitHub webhook을 받는 Cloudflare Worker가 commit 메시지를 파싱해 텔레그램 알림에 카테고리·태그 메타라인을 표시하기 위함. 컨벤션을 어겨도 빌드는 통과하지만, 알림 메타라인이 폴더 경로 fallback으로만 표시되어 정보가 줄어든다.

## 실패 시 행동

다음 상황에서는 작업 중단하고 명확한 에러 반환:

- 메시지가 너무 짧거나 모호함 ("ㅎㅇ", "ㅋ", 단어 1개만 등)
- 동일 slug 파일이 이미 3개 이상
- frontmatter 스키마 위반 발견
- prefix가 `[ideas/...]`인데 카테고리가 4종 enum에 없음

부분 실패(WebSearch 1회 실패, 유사 글 검색 0건 등)는 무시하고 진행. 해당 섹션만 생략.

## 작업 완료 시 출력

- 생성 파일 경로
- frontmatter의 `title`
- 커밋 SHA
- 배포 후 예상 URL: `https://chakki-the-potato.github.io/Hard_Working/ideas/{category}/{slug}/`

## 작업하지 않을 것

- 정식 블로그 초안 작성 — `blog-draft` 스킬의 역할
- 이미지 생성·검색
- frontmatter에 스키마 외 필드 추가 (`description`, `draft`, `updatedDate`, works 메타 등)
- 기존 아이디어 수정 (덮어쓰기 위험)
- 여러 아이디어 동시 작성
