---
title: "React Hooks 기초: useState와 useEffect 완벽 가이드"
description: "React의 가장 기본적인 Hook인 useState와 useEffect의 사용법과 주의사항을 예제와 함께 정리합니다."
pubDate: 2026-02-18
category: programming
tags: ["Frontend"]
---

## React Hooks란?

Hooks는 React 16.8에 도입된 기능으로, 클래스 컴포넌트 없이도 상태(state)와 생명주기(lifecycle) 기능을 사용할 수 있게 해줍니다.

## useState

컴포넌트에 상태를 추가하는 가장 기본적인 Hook입니다.

```jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>현재 카운트: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        +1
      </button>
    </div>
  );
}
```

### 주의사항

상태 업데이트는 **비동기**로 처리됩니다. 이전 상태를 기반으로 업데이트할 때는 함수형 업데이트를 사용하세요.

```jsx
// 나쁜 예: 연속 호출 시 문제 발생
setCount(count + 1);
setCount(count + 1); // count가 한 번만 증가

// 좋은 예: 함수형 업데이트
setCount(prev => prev + 1);
setCount(prev => prev + 1); // count가 두 번 증가
```

## useEffect

컴포넌트의 **부수 효과(side effect)** 를 처리하는 Hook입니다. API 호출, DOM 조작, 구독 설정 등에 사용합니다.

```jsx
import { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => setUser(data));
  }, [userId]); // userId가 변경될 때만 실행

  if (!user) return <p>로딩 중...</p>;
  return <h1>{user.name}</h1>;
}
```

### 의존성 배열의 3가지 패턴

```jsx
// 1. 매 렌더링마다 실행
useEffect(() => {
  console.log('매번 실행');
});

// 2. 마운트 시 1번만 실행
useEffect(() => {
  console.log('처음 한 번만 실행');
}, []);

// 3. 특정 값이 변경될 때 실행
useEffect(() => {
  console.log(`userId가 ${userId}로 변경됨`);
}, [userId]);
```

### 클린업 함수

구독이나 타이머를 설정한 경우, 정리(cleanup) 함수를 반환해야 메모리 누수를 방지할 수 있습니다.

```jsx
useEffect(() => {
  const timer = setInterval(() => {
    console.log('tick');
  }, 1000);

  // 클린업: 컴포넌트가 언마운트되거나 재실행 전에 호출
  return () => clearInterval(timer);
}, []);
```

## 정리

| Hook | 용도 | 핵심 포인트 |
|------|------|------------|
| `useState` | 상태 관리 | 함수형 업데이트 사용 권장 |
| `useEffect` | 부수 효과 처리 | 의존성 배열과 클린업 함수 |

Hooks를 잘 이해하면 React 개발이 훨씬 수월해집니다!
