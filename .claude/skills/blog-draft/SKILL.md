---
name: blog-draft
description: 텔레그램에서 받은 메시지를 분석하여 Hard_Working 블로그의 초안 마크다운 파일을 작성하고 main 브랜치에 커밋한다. `[blog/...]` prefix가 있으면 카테고리 강제, 없으면 자연어 자동 라우팅. 필요 시 웹 조사를 수행한다.
---

# Blog Draft Skill

스타트업 CTO이자 AI 에이전트 엔지니어로 활동 중인 사용자의 **기술 블로그 초안 작성 파트너**로 동작한다. 텔레그램으로 던져진 짧은 메모를 받아, 지정된 스키마와 톤앤매너에 맞춰 완성도 있는 마크다운 초안을 만들어 레포에 커밋한다.

## 입력 형식

트리거 페이로드의 `text` 필드에 사용자가 작성한 텔레그램 메시지 텍스트가 들어 있다. 두 가지 입력 방식을 지원하며, **prefix가 있으면 prefix 우선**, 없으면 자연어 자동 라우팅으로 폴백한다.

### 1. Prefix 양식 (권장)

| Prefix | 양식 |
|---|---|
| `[blog/programming]` | `[blog/programming] 주제 — 한 줄 요약 — tag 후보` |
| `[blog/design]` | `[blog/design] 주제 — 한 줄 요약` |
| `[blog/thinking]` | `[blog/thinking] 주제 — 결론 메시지` |
| `[blog/works]` | `[blog/works] 프로젝트명 — demoUrl / repoUrl / role / period — 결정 2~3개` |
| `[blog/{category}/{project-slug}]` | 위 4종에 프로젝트를 묶을 때. 예: `[blog/programming/agent-bot] 텔레그램 트리거 만들기 — Cloudflare Worker로 — Tools` |

prefix가 검출되면 **카테고리는 강제**되고, 자연어 분류 가이드는 적용하지 않는다. 확장 prefix `[blog/{category}/{project-slug}]`는 카테고리 강제 + project slug까지 강제(=폴더와 frontmatter `project` 필드에 동일 값을 사용). 본문 구성은 아래 "카테고리별 본문 구성 가이드"를 따른다.

### 2. 자연어 fallback

prefix가 없는 경우 기존처럼 메시지 내용을 분석해 카테고리를 추론한다. 예시:

- programming: "TypeScript의 satisfies 연산자, type assertion과 차이점 위주로"
- design: "디자인 시스템 컬러 토큰 네이밍 컨벤션"
- thinking: "사이드 프로젝트 OSS로 푸는 시점 판단 기준"
- works: "이번 공모전에 출품한 에이전트 회고. 데모 https://example.app, 기간 2025.11~2026.02"

## 작업 흐름

1. **메시지 분석** — prefix 검출 → 있으면 카테고리(+ project slug) 강제, 없으면 자연어 자동 라우팅. 주제·방향·사용자 제공 정보(데모 URL, 기간, 결정 항목 등) 파악
2. **카테고리 결정** — `programming` / `design` / `thinking` / `works` 중 하나 (4종, 소문자). 자연어 입력은 아래 "카테고리 분류 가이드" 참조
3. **조사 판단** — 충분한 정보가 있으면 생략. 최신 정보가 필요하면 웹 검색 (2~4회)
4. **slug 생성** — 영문 소문자, 단어 사이 하이픈
4b. **project slug 결정 (옵션)** — 다음 중 하나면 project slug 부여:
   - prefix가 `[blog/{category}/{project-slug}]` 확장형 → project slug 강제
   - 자연어 메시지에 "프로젝트: foo" / "이 프로젝트도 같이" / 명확한 프로젝트 이름 명시 → project slug 추론
   - 동일 프로젝트의 글이 이미 있고 사용자가 그 흐름의 연장임을 시사 → 기존 project slug 재사용
   - 모호하면 부여하지 않음 (project는 옵션 필드)
   - project slug는 영문 소문자 hyphenated (예: `agent-bot`, `hard-working-stack`)
5. **현재 KST 시각 확인** — Bash로 두 값을 동시에 추출:
   - `pubDate`용: `TZ=Asia/Seoul date '+%Y-%m-%dT%H:%M:%S+09:00'`
   - 폴더명용 연도: `TZ=Asia/Seoul date '+%Y'`
5b. **버전 체크 (versioning)** — 동일 slug 파일이 `src/data/blog/{category}/**/{slug}.md`에 존재하는지 확인
   - **존재하지 않음 → 신규 글 모드**: frontmatter에 `version: "v1.0"` 부여 (필수)
   - **존재 → 버전 업데이트 모드**: 사용자 요청이 명확히 "이 글 갱신·보강"이 아니면 작업 중단하고 사용자에게 확인. 갱신 모드 진입 시 다음 순서대로 진행:
     1. 기존 파일 frontmatter 전체 + 본문 그대로 읽기
     2. 기존 파일 전체를 `src/data/blog-versions/{category}/{slug}/{기존 version의 파일명-form}.md`로 복사 (그대로 — 본문 변경 없이).
        - **파일명 form**: frontmatter의 `"v1.0"` → 파일명은 `v1-0.md` (점 대신 하이픈, 점은 Astro URL 세그먼트에서 제거되기 때문). 일반화: `v{major}.{minor}` → `v{major}-{minor}.md`
        - 복사본 frontmatter에 두 필드만 추가:
          - `archivedDate: TODAY` (KST `YYYY-MM-DD`)
          - `parentSlug: "{category}/{slug}"` (원본의 collection id, year 제외)
        - 복사본 frontmatter의 `version`은 점 표기 유지 (`"v1.0"`). 표시 라벨은 frontmatter, URL은 파일명에서 결정
        - 만약 기존 파일에 `version` 필드가 없었다면 archive 파일에 `version: "v1.0"`을 명시적으로 추가 (필수 필드)
     3. 원본 파일 본문을 새 내용으로 갱신
     4. 원본 frontmatter `version`을 v1.x+1로 bump (예: `v1.0` → `v1.1`, `v1.2` → `v1.3`). version이 없던 글이면 `v1.1`로
     5. 원본 frontmatter에 `updatedDate: TODAY` 추가/갱신 (`pubDate`는 변경 금지)
6. **양식 reference 로드** — `.claude/skills/blog-draft/templates/{category}.md`가 존재하면 본문 작성 전에 반드시 읽는다 (없으면 skip)
7. **frontmatter + 본문 작성** — 양식의 톤·구조를 흉내 내고, 아래 톤·구성 규칙도 엄수
8. **파일 저장** — project slug가 없으면 `src/data/blog/{category}/{year}/{slug}.md`, 있으면 `src/data/blog/{category}/{project}/{slug}.md`. 폴더가 없으면 새로 생성. 버전 업데이트 모드면 archive 파일도 같이 저장
9. **커밋 + 푸시** — 신규는 `draft({category}/{Tag1}): {글 제목}` 또는 project가 있으면 `draft({category}/{project}/{Tag1}): {글 제목}`, 갱신은 `update({category}/{Tag1}): {글 제목} → {new version}` 메시지로 main 브랜치에 직접 커밋한 뒤 즉시 `git push origin main` 실행

## Frontmatter 스키마 (절대 어기지 말 것)

`src/content.config.ts`의 Zod 스키마와 정확히 일치해야 빌드 통과.

```yaml
---
title: "글의 제목"
description: "1~2문장 요약, SEO용"
pubDate: 2026-04-28T14:32:08+09:00
category: programming
tags: ["Backend"]
version: "v1.0"
---
```

> `pubDate`의 시:분:초는 작업 흐름 5단계의 `TZ=Asia/Seoul date` 출력을 그대로 사용한다. 사용자 입력 양식 예시에 적힌 `T00:00:00`은 표기 예시일 뿐이며, 실제로는 현재 시각으로 채워 같은 날 여러 글의 정렬을 보장한다.

### 필드별 규칙

- `title`: 30~60자. 큰따옴표로 감싸기. 콜론 포함 시 따옴표 필수
- `description`: 80~150자. 글의 핵심 1~2문장. SEO 메타로도 사용
- `pubDate`: 한국 시간 기준 최초 작성 시각 (`YYYY-MM-DDTHH:mm:ss+09:00`). 버전 업데이트 시에도 변경 금지
- `category`: **필수 필드**. `programming` / `design` / `thinking` / `works` 중 하나 (소문자). enum 미스매치 시 빌드 실패. 폴더 경로의 카테고리와 반드시 동일해야 함
- `tags`: 카테고리와 별개의 자유 라벨. 영문, 첫 글자 대문자, 0~3개. 예: `["Backend"]`, `["Tools", "Caching"]`. 비워도 OK
- `version`: **필수 필드**. 신규 글은 항상 `"v1.0"` (큰따옴표 필수). 동일 slug 충돌로 갱신 모드 진입 시 5b 정책에 따라 patch +1

### 스키마 지원 optional 필드 (기본은 추가하지 않음)

다음 필드들은 blog 컬렉션 스키마에 존재하지만 **명시 요청이 있을 때만** 추가한다. 일반 초안에는 추가하지 않는다:

- `updatedDate`: 버전 업데이트 모드(5b)에서 자동으로 추가/갱신. 신규 초안에는 사용 안 함
- `draft`: 인박스에서 숨길 때만 `true`. 기본 false라 명시 안 하면 발행됨
- `heroImage`: 대표 이미지 경로. 사용자가 직접 채울 영역이라 초안에서는 추가 안 함
- `project`: 프로젝트 묶음 slug. 작업 흐름 4b에서 결정된 경우에만 추가. 폴더 경로의 `{project}` 세그먼트와 정확히 동일해야 함 (예: `project: "agent-bot"` ↔ `src/data/blog/programming/agent-bot/...`)

### works 카테고리 전용 optional 메타

`category: works`인 경우에만 의미가 있는 선택 필드. PostLayout이 이 값을 메타 블록으로 렌더링한다.

- `demoUrl`: 배포된 데모 URL (https://...)
- `repoUrl`: GitHub/GitLab 등 저장소 URL
- `role`: 본인 역할 (예: "Solo developer", "PM·Frontend")
- `period`: 진행 기간 (예: "2025.11 ~ 2026.02")
- `outcome`: 성과·결과 (예: "수상 X 본선 진출", "MAU 300")

`[blog/works]` prefix 입력은 `demoUrl / repoUrl / role / period`를 본문 양식에 넣어주므로 그대로 매핑한다. 비어 있는 항목은 frontmatter에 키 자체를 넣지 않는다.

## 카테고리 분류 가이드 (자연어 fallback용)

자동 분류 enum 4종.

- `programming`: 코드, 프레임워크, 라이브러리, 알고리즘, 시스템 설계, 언어 기능 등 "개념·구현"이 글의 중심. **도구 사용기·CLI 설정·에디터 워크플로우도 여기에 포함**하며, 이 경우 `tags`에 `Tools`를 추가
- `design`: UI/UX, 타이포그래피, 색감, 디자인 시스템, 사용자 경험
- `thinking`: 학습 방법, 커리어, 의사결정, 회고, 생각 정리, 책/강의 후기
- `works`: 직접 만든 결과물 전용. 프로젝트·자체 제작 에이전트·공모전 출품작·사이드 프로젝트 런칭. 메시지에서 다음 신호 중 하나 이상이면 자동 라우팅:
  - "프로젝트", "공모전", "출품", "런칭", "출시", "에이전트 만들었", "만든 결과물", "사이드 프로젝트" 같은 키워드
  - 데모 URL / 저장소 URL이 본문에 포함
  - 역할·기간·성과 같은 메타가 메시지에 명시
  - works 글은 `src/data/blog/works/{year}/{slug}.md`에 저장하고, "works 카테고리 전용 optional 메타" 필드를 가능한 범위에서 채움

> 사용자가 메시지에 "works 카테고리로" 같이 명시하면 자동 판단을 무시하고 명시한 카테고리를 사용한다.

### 분류 예시

| 메시지 | 카테고리 | tags | 이유 |
|---|---|---|---|
| "TypeScript satisfies 연산자" | `programming` | `["TypeScript"]` | 언어 기능 자체 |
| "Docker 멀티스테이지 빌드" | `programming` | `["Docker"]` | 빌드 *개념* |
| "Claude Code 슬래시 커맨드 정리" | `programming` | `["Tools"]` | 도구 사용기 → programming + Tools 태그 |
| "neovim LSP 설정" | `programming` | `["Tools"]` | 에디터 설정 |
| "tmux 워크플로우" | `programming` | `["Tools"]` | 도구 워크플로우 |
| "VSCode에서 useEffect 무한 루프 디버깅" | `programming` | `["React"]` | 도구 안에서 다룬 개념·기법 |
| "gh CLI로 PR 자동화" | `programming` | `["Tools"]` | gh 자체 사용법 |
| "사이드 프로젝트 출품 회고, repo: github.com/foo/bar" | `works` | — | 만든 결과물 + 저장소 URL |
| "공모전에 낸 에이전트 회고" | `works` | — | "공모전" 키워드 |
| "OSS로 푸는 시점 판단" | `thinking` | — | 의사결정 |
| "디자인 시스템 토큰 네이밍" | `design` | — | 디자인 시스템 |

## 파일 경로 규칙

두 가지 분기가 있음. project slug 부여 여부에 따라 갈림:

```
비프로젝트 글: src/data/blog/{category}/{year}/{slug}.md   (기존 그대로)
프로젝트 글:   src/data/blog/{category}/{project}/{slug}.md  (year 자리에 project)
```

- `{category}`는 frontmatter `category` 값과 반드시 동일
- 비프로젝트 글: `{year}`는 현재 KST 연도 (`TZ=Asia/Seoul date '+%Y'`). pubDate를 거꾸로 파싱하지 않음
- 프로젝트 글: `{project}`는 frontmatter `project` 값과 반드시 동일. year 폴더는 사용하지 않음 (4자리 숫자 패턴이면 `flattenYear`가 year로 오인하므로 project slug에 4자리 숫자 단독은 금지)
- 카테고리/연도/프로젝트 폴더가 없으면 새로 생성
- 파일명에 날짜 prefix 없음
- slug는 영문 hyphenated (예: `langgraph-checkpointer`, `docker-multi-stage-build`)
- slug 충돌 검사는 **동일 카테고리 폴더 전체** 안에서 수행 (`src/data/blog/{category}/**/{slug}.md` glob, project 폴더도 자동 포함). 다른 카테고리에 같은 slug가 있어도 OK
- 동일 카테고리 내 충돌 시 5b 정책에 따라 **버전 업데이트 모드**로 진입 (기존 글 갱신). 진짜로 별개 주제이고 신규 글로 가야 한다면 사용자에게 확인 후 slug에 `-2`, `-3` 등 붙여 분기

## 작성 시 명심할 것

- 본문 작성 *전에* 반드시 SKILL.md를 먼저 읽었는지 확인 — 이 문서가 frontmatter·톤·구조의 source of truth
- frontmatter는 `src/content.config.ts`의 `blog` 컬렉션 Zod 스키마와 정확히 일치해야 함
- 스키마에 정의되지 않은 필드는 절대 추가 금지
- 스키마에 있는 optional 필드(`updatedDate`, `draft`, `heroImage`, `project`)도 명시 요청 없으면 추가하지 않음 — 위 "스키마 지원 optional 필드" 섹션 참조
- 파일 경로: 비프로젝트 글 `src/data/blog/{category}/{year}/{slug}.md`, 프로젝트 글 `src/data/blog/{category}/{project}/{slug}.md`
- 프로젝트 글이면 frontmatter `project` 값과 폴더의 `{project}` 세그먼트가 정확히 같아야 함
- works 카테고리에서만 optional 메타(`demoUrl` / `repoUrl` / `role` / `period` / `outcome`) 사용. 비어있는 항목은 frontmatter에 키 자체를 넣지 않음

## 본문 작성 톤 (가장 중요)

**친절하고 프로페셔널한 대화형 말투 (경어체)**를 사용한다. "~했습니다", "~했어요", "~라고 생각합니다"를 자연스럽게 섞어 쓴다.

딱딱한 기술 문서가 아니라, 밋업이나 세미나에서 동료 개발자에게 경험과 고민의 과정을 편안하게 공유하는 느낌으로 쓴다. 단순 지식 나열보다 **'왜 이 결정을 내렸는지'**, **'어떤 마찰이나 고민이 있었는지'** 같은 빌더(Builder)로서의 인사이트와 회고가 묻어나야 한다.

### 톤 규칙

- 경어체 일관 ("~했습니다" / "~합니다" / "~했어요" / "~이죠" / "~네요" / "~더라고요" 등). 반말·문어체 금지
- 1인칭("처음에는 ~했는데", "저는 ~합니다") 자연스럽게 허용. 회고·결정 과정 서술에 특히 유용
- 단정 표현보다 경험·관찰·판단을 그대로 옮기기. "정답"이 아니라 "이 상황에서는 이렇게 결정했다"
- AI 클리셰 금지: "훌륭한 질문입니다", "정확하십니다", 빈 사과("혼란을 드려 죄송합니다"), 자기 내레이션 남발, "AI로서·언어 모델로서" 자기언급
- 이모지 사용 금지

### 참고 기준 글

매 글 작성 시 카테고리 양식 파일을 **먼저** 읽고 톤·문장 길이·회고 비중·코드 블록 위치를 그대로 흉내 낸다. 발행본은 보조 참고용.

- 1차 reference (양식): `.claude/skills/blog-draft/templates/{category}.md` — 현재 `works.md`만 존재. 다른 카테고리는 사용자가 양식을 가져오면 같은 위치에 추가
- 2차 reference (실제 발행본): `src/data/blog/works/2026/hard-working-stack-buildlog.md`

## 카테고리별 본문 구성 가이드

### `[blog/programming]`

- 도입 2~5문장: 왜 이 주제를 다루는지, 이 글이 답할 질문 또는 비교 포인트
- `##` 섹션 3~6개로 구조화
- 코드 블록과 기술 선택 기준 / 다른 옵션과의 비교가 자연스럽게 포함
- 마지막은 "주의사항·팁" 또는 "참고 자료"로 마무리

### `[blog/design]`

- 도입 2~5문장: 시각·UX 관점에서 다룰 결정 또는 가설
- `##` 섹션 3~5개. UI 결정·근거·트레이드오프 중심
- 스크린샷·도식이 들어갈 만한 위치에 다음 마커를 남긴다 (이미지는 사용자가 직접 채움):

```html
<!-- 여기에 OOO 이미지 삽입 -->
```

- 코드는 거의 없음. 필요하면 CSS/디자인 토큰 발췌 정도

### `[blog/thinking]`

- 코드는 거의 사용하지 않음
- 도입에서 주제·맥락 → 본문에서 고민·관찰·반례 → 마지막에 결론 메시지로 이어지는 흐름
- `##` 섹션 2~5개. 단정보다 "왜 이렇게 보게 되었는지"의 사고 과정을 보임
- 1인칭 회고를 적극 사용

### `[blog/works]`

- 도입 2~4문장: 프로젝트가 무엇이고, 누구를 위해 / 왜 만들었는지
- 입력으로 받은 **결정 2~3개를 `##` 소제목**으로 삼아 의사결정 과정을 풀어 씀
- 각 결정 섹션에는: 선택지 → 무엇을 골랐는지 → 트레이드오프 → 실제 운영 결과
- 끝에 "되돌린 시도" 또는 "앞으로 손볼 것" 섹션 권장
- frontmatter에 `demoUrl` / `repoUrl` / `role` / `period`(가능하면 `outcome`)를 채움
- **이미지 자리** (사용자가 나중에 채움 — 초안에선 마커만):
  - 본문 내 도식·스크린샷·플로우 차트가 들어갈 자리엔 design 가이드와 동일한 마커 사용:
    ```html
    <!-- 여기에 OOO 이미지 삽입 (예: public/images/posts/{project}/{slug}/architecture.png) -->
    ```
  - 이미지 파일 경로 컨벤션: `public/images/posts/{project}/{slug}/{name}.png`. 마크다운/frontmatter 참조 시엔 BASE_URL 포함 (`/Hard_Working/images/posts/{project}/{slug}/{name}.png`)
  - `heroImage`는 사용자가 직접 채울 영역이라 신규 초안 frontmatter엔 키 자체를 넣지 않음. 대신 본문 맨 위에 다음 HTML 주석으로 채우는 방법을 안내:
    ```html
    <!-- HERO 이미지 추가 시:
         1. public/images/posts/{project}/{slug}/hero.png 파일 업로드
         2. frontmatter에 heroImage: "/Hard_Working/images/posts/{project}/{slug}/hero.png" 추가
         3. 이 주석 삭제 -->
    ```

## 코드 블록 작성 규칙

Astro Shiki(`github-light`/`github-dark`)가 언어 토큰에 따라 색을 입힌다.

- **언어 태그 필수**: 빈 ` ``` `는 단색 회색으로 렌더되므로 절대 사용 안 함
- **권장 alias 목록**:
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
- **분량**: 한 블록 5~20줄 권장. 30줄 넘으면 핵심만 발췌하고 `// ...`로 생략
- **인라인 코드**: 함수명·변수명·짧은 명령은 백틱 1개로 강조
- **파일명/경로 표기**: 코드 블록 바로 위에 `**경로**` 형태로 한 줄 추가 (예: `**src/utils/date.ts**`)

## 분량

- 짧은 글: 800~1500자 (개념 정리, 팁)
- 중간 글: 1500~3000자 (실전 가이드, works 빌드로그)
- 한 글에 하나의 주제만

## 웹 조사 가이드

- 2~4번 검색 권장
- 최신성이 중요한 주제(라이브러리 버전, 가격, 정책)는 반드시 검색
- 일반 개념은 검색 없이 작성 가능
- 검색 결과는 자신의 말로 재구성. 직접 인용 최소화
- 출처 중요할 때만 본문 마지막에 "참고 자료" 섹션

## 커밋 컨벤션

신규 글:
```
draft({category}/{Tag1}): {글 제목}

via telegram-bot
```

버전 업데이트(5b 갱신 모드):
```
update({category}/{Tag1}): {글 제목} → {new version}

via telegram-bot
```

규칙:
- `{category}`: frontmatter `category` 값 그대로 (소문자, programming/design/thinking/works 중 하나)
- `{project}`: frontmatter `project` 값 (있으면). 프로젝트 글일 때만 scope에 추가
- `{Tag1}`: frontmatter `tags[0]` (있으면)
- 조합 우선순위: `{category}/{project}/{Tag1}` > `{category}/{project}` > `{category}/{Tag1}` > `{category}`
- `tags`도 `project`도 비어 있으면 `draft({category}): {글 제목}` / `update({category}): {글 제목} → {new version}` 로 (괄호 유지)
- 제목 부분은 frontmatter의 `title` 그대로
- `{new version}`은 bump 후 값 (예: `v1.1`, `v1.3`)
- 갱신 모드에선 archive 복사 파일과 원본 갱신을 **단일 커밋**에 묶음
- 한 번에 한 글만 커밋
- main 브랜치에 직접 푸시 (브랜치 분기, PR 사용 안 함)
- **`git commit` 직후 자동으로 `git push origin main` 실행** — Claude가 push까지 책임진다

예시:
- `draft(programming/Backend): 비동기 처리에서 Promise.allSettled 활용하기`
- `draft(programming/agent-bot/Tools): 텔레그램 트리거를 Cloudflare Worker로`
- `draft(design/UI): 다크 모드 채도 토큰 네이밍 패턴`
- `draft(thinking): 사이드 프로젝트 OSS 공개 시점 판단`
- `draft(works/Astro): Hard_Working 블로그 빌드로그`
- `update(programming/Tools): ccusage로 Claude 사용량 한눈에 파악하기 → v1.1`

이 컨벤션은 GitHub webhook을 받는 Cloudflare Worker가 commit 메시지를 파싱해 텔레그램 알림에 카테고리·태그 메타라인을 표시하기 위함. 컨벤션을 어겨도 빌드는 통과하지만, 알림 메타라인이 폴더 경로 fallback으로만 표시되어 정보가 줄어든다.

## 실패 시 행동

다음 상황에서는 작업 중단하고 명확한 에러 반환:

- 메시지가 너무 짧거나 모호함 (단어 1개, 이모지 단독, "ㅎㅇ", "ㅋ" 등)
- 동일 slug 파일이 이미 3개 이상
- frontmatter 스키마 위반 발견 (깨진 마크다운 commit 방지 — 커밋하지 않음)
- prefix가 `[blog/...]`인데 카테고리가 4종 enum에 없음
- `git push` 실패 → 1회 재시도, 그래도 실패하면 에러 출력하고 중단

부분 실패(검색 한 번 실패 등)는 무시하고 진행.

## 작업 완료 시 출력

- 생성 파일 경로
- frontmatter의 title
- 커밋 SHA
- 배포 후 예상 URL: `https://chakki-the-potato.github.io/Hard_Working/posts/{category}/{slug}/`

## 작업하지 않을 것

- 글의 완벽한 마무리 — 초안까지만. 사용자가 직접 다듬음
- 이미지 생성/검색 (design 글의 마커는 사용자가 채움)
- 스키마 지원 optional 필드를 임의로 추가 — `heroImage` / `draft`는 명시 요청이 있을 때만 (`updatedDate`는 5b 갱신 모드에서 자동)
- 기존 글 무단 덮어쓰기 — 갱신은 5b 정책(archive 복사 + version bump)에 따라서만. 사용자가 명확히 갱신을 원하지 않는데 동일 slug면 작업 중단하고 확인
- 여러 글 동시 작성
- 글 작성 외 작업 — 코드 수정, 설정 파일 수정, 다른 스킬 수정, 워크플로우 수정 등 절대 금지 (이 스킬은 오직 `src/data/blog/` 와 `src/data/blog-versions/` 아래 마크다운 파일만 만들거나 수정한다)
