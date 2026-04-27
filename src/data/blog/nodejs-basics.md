---
title: "Node.js 입문 — 비동기와 이벤트 루프 이해하기"
description: "Node.js의 핵심인 비동기 처리와 이벤트 루프 동작 방식을 이해하고, Express로 간단한 서버를 만드는 방법을 다룹니다."
pubDate: 2026-02-18
tags: ["Programming", "Backend"]
---

## Node.js가 특별한 이유

Node.js는 **싱글 스레드 + 논블로킹 I/O** 모델로 동작합니다.
Java나 PHP가 요청마다 새 스레드를 만드는 것과 달리, Node.js는 단 하나의 스레드로 수천 개의 동시 연결을 처리합니다.

## 이벤트 루프 동작 원리

```text
   ┌─────────────────────────┐
   │        Call Stack        │
   └──────────┬──────────────┘
              │ 비어있으면
   ┌──────────▼──────────────┐
   │      Event Queue         │ ← setTimeout, I/O 콜백
   └─────────────────────────┘
```

핵심 흐름:
1. 동기 코드 실행 → Call Stack에 쌓임
2. 비동기 작업(setTimeout, HTTP 요청 등) → Web API로 위임
3. 완료된 콜백 → Event Queue 대기
4. Call Stack이 비면 → Event Queue에서 꺼내 실행

## 콜백 → Promise → async/await

### 콜백 방식 (구식)

```js
fs.readFile('data.txt', 'utf8', (err, data) => {
  if (err) throw err;
  console.log(data);
});
```

### Promise 방식

```js
fs.promises.readFile('data.txt', 'utf8')
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

### async/await (현재 표준)

```js
async function readData() {
  try {
    const data = await fs.promises.readFile('data.txt', 'utf8');
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}
```

## Express로 서버 만들기

```bash
npm init -y
npm install express
```

```js
import express from 'express';

const app = express();
app.use(express.json());

// GET 요청
app.get('/api/posts', (req, res) => {
  res.json({ posts: [] });
});

// POST 요청
app.post('/api/posts', (req, res) => {
  const { title, content } = req.body;
  // DB 저장 로직...
  res.status(201).json({ message: '생성 완료', title });
});

app.listen(3000, () => {
  console.log('서버 실행 중: http://localhost:3000');
});
```

## 미들웨어 패턴

Express의 핵심은 미들웨어 체인입니다.

```js
// 로깅 미들웨어
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next(); // 다음 미들웨어로 전달
});

// 인증 미들웨어
const authenticate = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: '인증 필요' });
  next();
};

app.get('/api/me', authenticate, (req, res) => {
  res.json({ user: '...' });
});
```

## 환경 변수 관리

```bash
npm install dotenv
```

```bash
# .env
DATABASE_URL=mongodb://localhost:27017/mydb
JWT_SECRET=my-secret-key
PORT=3000
```

```js
import 'dotenv/config';

const port = process.env.PORT || 3000;
```

## 자주 쓰는 npm 패키지

| 패키지 | 용도 |
|--------|------|
| `express` | 웹 서버 프레임워크 |
| `dotenv` | 환경 변수 관리 |
| `bcrypt` | 패스워드 해싱 |
| `jsonwebtoken` | JWT 인증 |
| `mongoose` | MongoDB ODM |
| `zod` | 스키마 유효성 검사 |
