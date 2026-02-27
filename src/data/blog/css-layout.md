---
title: "CSS Flexbox & Grid 완전 정복"
description: "float 시대는 끝났습니다. Flexbox와 Grid로 어떤 레이아웃이든 만들 수 있습니다. 헷갈리는 속성들을 시각적으로 정리합니다."
pubDate: 2026-01-20
tags: ["CSS"]
---

## Flexbox — 1차원 레이아웃

한 방향(행 또는 열)으로 아이템을 정렬할 때.

```css
.container {
  display: flex;
  flex-direction: row;        /* row | column */
  justify-content: center;    /* 주축 정렬 */
  align-items: center;        /* 교차축 정렬 */
  gap: 16px;
  flex-wrap: wrap;            /* 줄바꿈 허용 */
}

.item {
  flex: 1;                    /* flex-grow: 1, flex-shrink: 1 */
  flex: 0 0 200px;            /* 고정 너비 */
}
```

### justify-content 값

| 값 | 설명 |
|---|---|
| `flex-start` | 시작점 정렬 |
| `flex-end` | 끝점 정렬 |
| `center` | 가운데 정렬 |
| `space-between` | 양 끝 + 사이 균등 |
| `space-around` | 모든 항목 주위 균등 |

## Grid — 2차원 레이아웃

행과 열을 동시에 제어할 때.

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);  /* 3열 균등 */
  grid-template-rows: auto;
  gap: 24px;
}

/* 반응형 그리드 */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}
```

### 아이템 배치

```css
.header {
  grid-column: 1 / -1;    /* 전체 열 차지 */
  grid-row: 1;
}

.sidebar {
  grid-column: 1;
  grid-row: 2 / 4;        /* 2~3행 차지 */
}
```

## 실전 패턴

```css
/* 수직 수평 중앙 정렬 */
.center {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Holy Grail 레이아웃 */
.layout {
  display: grid;
  grid-template:
    "header header header" auto
    "nav    main   aside " 1fr
    "footer footer footer" auto
    / 200px 1fr 200px;
  min-height: 100vh;
}

/* 카드 그리드 (반응형) */
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
  gap: 24px;
}
```

## Flexbox vs Grid 선택 기준

- **Flexbox**: 네비게이션 바, 버튼 그룹, 카드 내부 레이아웃
- **Grid**: 페이지 전체 레이아웃, 카드 그리드, 복잡한 2차원 배치
