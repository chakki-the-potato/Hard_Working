---
title: "서버리스 아키텍처 실전 — AWS Lambda + API Gateway"
description: "서버 없이 API를 만드는 서버리스 아키텍처. AWS Lambda와 API Gateway로 확장 가능한 백엔드를 구축하는 방법을 실제 예제로 설명합니다."
pubDate: 2026-01-28
tags: ["Programming", "Backend"]
---

## 서버리스의 장단점

**장점**
- 서버 관리 불필요
- 사용한 만큼만 비용 (월 100만 요청 무료)
- 자동 스케일링

**단점**
- Cold Start 지연 (첫 요청 느림)
- 실행 시간 제한 (최대 15분)
- 로컬 테스트가 번거로움

## 기본 Lambda 함수 구조

```js
// handler.js
export const handler = async (event, context) => {
  console.log('Event:', JSON.stringify(event));

  try {
    const body = JSON.parse(event.body || '{}');
    const { name } = body;

    if (!name) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'name은 필수입니다' }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `안녕하세요, ${name}님!` }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: '서버 오류' }),
    };
  }
};
```

## Serverless Framework로 배포

```bash
npm install -g serverless
```

```yaml
# serverless.yml
service: my-api

provider:
  name: aws
  runtime: nodejs20.x
  region: ap-northeast-2

functions:
  greet:
    handler: handler.handler
    events:
      - http:
          path: /greet
          method: post
          cors: true
```

```bash
serverless deploy
# Endpoint: POST - https://xxxx.execute-api.ap-northeast-2.amazonaws.com/dev/greet
```

## DynamoDB 연동

```js
import { DynamoDBClient, PutItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const client = new DynamoDBClient({ region: 'ap-northeast-2' });

// 데이터 저장
await client.send(new PutItemCommand({
  TableName: 'Users',
  Item: marshall({ id: '123', name: '철수', createdAt: Date.now() }),
}));

// 데이터 조회
const { Item } = await client.send(new GetItemCommand({
  TableName: 'Users',
  Key: marshall({ id: '123' }),
}));
const user = unmarshall(Item);
```

## Cold Start 최적화

```js
// DB 연결을 핸들러 밖에서 (재사용됨)
const client = new DynamoDBClient({ region: 'ap-northeast-2' });

export const handler = async (event) => {
  // client는 이미 초기화된 상태로 재사용
};
```

**추가 팁**
- Provisioned Concurrency로 Cold Start 제거 (유료)
- 번들 사이즈 최소화 (esbuild 사용)
- 필요한 AWS SDK 모듈만 import
