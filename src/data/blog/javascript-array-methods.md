---
title: "JavaScript 배열 메서드 정리: map, filter, reduce"
description: "자주 사용하는 JavaScript 배열 메서드의 동작 원리와 실전 활용법을 정리합니다. map, filter, reduce를 중심으로 예제와 함께 알아봅니다."
pubDate: 2026-02-20
tags: ["JavaScript"]
---

## 배열 메서드란?

JavaScript에서 배열(Array)은 가장 많이 사용하는 자료구조 중 하나입니다. 배열 메서드를 잘 활용하면 반복문 없이도 데이터를 깔끔하게 처리할 수 있습니다.

## map()

`map()`은 배열의 각 요소를 변환하여 **새로운 배열**을 반환합니다.

```javascript
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log(doubled); // [2, 4, 6, 8, 10]
```

### 실전 활용

API에서 받은 데이터를 화면에 표시할 형태로 변환할 때 유용합니다.

```javascript
const users = [
  { id: 1, firstName: '홍', lastName: '길동' },
  { id: 2, firstName: '김', lastName: '철수' },
];

const names = users.map(user => `${user.firstName}${user.lastName}`);
console.log(names); // ['홍길동', '김철수']
```

## filter()

`filter()`는 조건에 맞는 요소만 걸러서 **새로운 배열**을 반환합니다.

```javascript
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const evens = numbers.filter(n => n % 2 === 0);
console.log(evens); // [2, 4, 6, 8, 10]
```

## reduce()

`reduce()`는 배열을 **하나의 값**으로 줄여나갑니다. 가장 강력하면서도 이해하기 어려운 메서드입니다.

```javascript
const numbers = [1, 2, 3, 4, 5];
const sum = numbers.reduce((acc, cur) => acc + cur, 0);
console.log(sum); // 15
```

### reduce로 그룹핑하기

```javascript
const fruits = ['apple', 'banana', 'apple', 'orange', 'banana', 'apple'];
const count = fruits.reduce((acc, fruit) => {
  acc[fruit] = (acc[fruit] || 0) + 1;
  return acc;
}, {});
console.log(count); // { apple: 3, banana: 2, orange: 1 }
```

## 메서드 체이닝

이 세 가지 메서드를 조합하면 복잡한 데이터 처리도 깔끔하게 할 수 있습니다.

```javascript
const products = [
  { name: '노트북', price: 1200000, inStock: true },
  { name: '키보드', price: 150000, inStock: true },
  { name: '모니터', price: 500000, inStock: false },
  { name: '마우스', price: 80000, inStock: true },
];

const total = products
  .filter(p => p.inStock)
  .map(p => p.price)
  .reduce((sum, price) => sum + price, 0);

console.log(total); // 1430000
```

## 정리

| 메서드 | 반환값 | 용도 |
|--------|--------|------|
| `map()` | 새 배열 | 변환 |
| `filter()` | 새 배열 | 필터링 |
| `reduce()` | 단일 값 | 집계 |

이 세 가지만 잘 이해해도 대부분의 배열 처리를 깔끔하게 할 수 있습니다!
