---
title: "React 상태 관리 라이브러리 비교 — Zustand vs Jotai vs Redux"
description: "React 프로젝트에서 전역 상태 관리를 어떻게 할지 고민될 때. Zustand, Jotai, Redux Toolkit의 특징과 사용법을 비교해 봅니다."
pubDate: 2026-02-10
category: programming
tags: ["Frontend"]
---

## 왜 상태 관리 라이브러리가 필요한가

컴포넌트가 3개일 때는 `useState`로 충분합니다. 하지만 앱이 커지면서 여러 컴포넌트가 같은 데이터를 공유해야 할 때 "prop drilling" 문제가 발생합니다.

## Zustand — 가장 심플한 선택

```bash
npm install zustand
```

```js
import { create } from 'zustand';

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  reset: () => set({ count: 0 }),
}));

function Counter() {
  const { count, increment } = useStore();
  return <button onClick={increment}>{count}</button>;
}
```

**장점**: 보일러플레이트 거의 없음, 직관적, 번들 크기 작음

## Jotai — 원자 단위 상태 관리

```bash
npm install jotai
```

```js
import { atom, useAtom } from 'jotai';

const countAtom = atom(0);
const doubleAtom = atom((get) => get(countAtom) * 2);

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

**장점**: Recoil과 유사, 파생 상태 선언이 자연스러움

## Redux Toolkit — 대규모 앱의 표준

```bash
npm install @reduxjs/toolkit react-redux
```

```js
import { createSlice, configureStore } from '@reduxjs/toolkit';

const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => { state.value += 1; },
  },
});

export const store = configureStore({ reducer: { counter: counterSlice.reducer } });
```

**장점**: DevTools 강력, 미들웨어 생태계, 대팀 협업에 적합

## 선택 기준

| 상황 | 추천 |
|------|------|
| 소규모 프로젝트 | Zustand |
| 복잡한 파생 상태 | Jotai |
| 대규모 / 팀 프로젝트 | Redux Toolkit |
