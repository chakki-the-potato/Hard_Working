---
title: "AWS 핵심 서비스 입문 — 개발자가 알아야 할 클라우드 기초"
description: "EC2, S3, RDS, Lambda까지 개발자가 실무에서 자주 쓰는 AWS 핵심 서비스를 정리합니다. 아키텍처 설계 패턴도 함께 다룹니다."
pubDate: 2026-02-22
tags: ["AWS"]
---

## AWS를 배워야 하는 이유

전 세계 클라우드 시장 점유율 1위(~33%). 국내 스타트업의 대다수가 AWS를 사용합니다.
한 번 익혀두면 어느 회사에서든 통용되는 기술입니다.

## AWS 핵심 서비스 지도

```
사용자
  │
  ▼
[Route 53] → DNS 라우팅
  │
  ▼
[CloudFront] → CDN (전 세계 엣지)
  │
  ▼
[ALB] → 로드밸런서
  │
  ├─→ [EC2] → 서버 인스턴스
  │
  └─→ [Lambda] → 서버리스 함수
        │
        ├─→ [RDS] → 관계형 DB
        ├─→ [DynamoDB] → NoSQL DB
        └─→ [S3] → 파일 스토리지
```

## EC2 — 가상 서버

EC2(Elastic Compute Cloud)는 가상 서버를 빌려 쓰는 서비스입니다.

### 인스턴스 타입 선택 기준

| 타입 | 특징 | 용도 |
|------|------|------|
| `t3.micro` | 무료 티어, 낮은 성능 | 개발/테스트 |
| `t3.medium` | 범용, 2vCPU/4GB | 소규모 서비스 |
| `c6g.large` | 컴퓨팅 최적화 | CPU 집약적 작업 |
| `r6g.large` | 메모리 최적화 | DB, 캐시 |

### 기본 배포 흐름

```bash
# SSH 접속
ssh -i my-key.pem ubuntu@ec2-12-34-56-78.compute.amazonaws.com

# Nginx 설치
sudo apt update && sudo apt install nginx -y

# PM2로 Node.js 앱 실행
pm2 start app.js --name my-app
pm2 save
```

## S3 — 파일 스토리지

S3(Simple Storage Service)는 무제한 파일 저장소입니다.

```js
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({ region: 'ap-northeast-2' });

// 파일 업로드
await s3.send(new PutObjectCommand({
  Bucket: 'my-bucket',
  Key: 'images/photo.jpg',
  Body: fileBuffer,
  ContentType: 'image/jpeg',
}));

// 퍼블릭 URL
// https://my-bucket.s3.ap-northeast-2.amazonaws.com/images/photo.jpg
```

### S3 활용 패턴
- 이미지/동영상 저장
- 정적 웹사이트 호스팅
- 로그 저장
- 백업

## RDS — 관계형 데이터베이스

RDS(Relational Database Service)는 MySQL, PostgreSQL 등을 관리형으로 운영합니다.

직접 EC2에 DB를 설치하는 것 대비 장점:
- 자동 백업
- 멀티 AZ 복제
- 패치 자동화
- 모니터링 대시보드

## Lambda — 서버리스

서버 없이 함수만 배포. 요청이 있을 때만 실행되고, 그만큼만 과금.

```js
export const handler = async (event) => {
  const { name } = JSON.parse(event.body);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: `Hello, ${name}!` }),
  };
};
```

### 언제 Lambda를 쓰나
- 이미지 리사이징 (S3 트리거)
- 스케줄 작업 (CloudWatch Events)
- 간단한 API 엔드포인트
- 트래픽이 불규칙한 서비스

## 비용 절감 팁

1. **EC2 Savings Plans** — 1~3년 약정으로 최대 72% 할인
2. **S3 Intelligent-Tiering** — 접근 빈도에 따라 자동 비용 최적화
3. **Lambda** — 월 100만 건까지 무료
4. **CloudWatch 알람** — 예상치 못한 과금 방지용 알람 설정 필수
