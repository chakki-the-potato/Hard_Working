---
title: "Docker 입문 — 컨테이너로 개발 환경 통일하기"
description: "내 컴퓨터에서는 되는데 서버에서 안 된다? Docker로 어디서나 동일한 실행 환경을 만드는 방법을 정리합니다. 이미지, 컨테이너, Compose까지."
pubDate: 2026-01-25
tags: ["Docker"]
---

## Docker란?

Docker는 애플리케이션을 **컨테이너**라는 격리된 환경에서 실행하는 플랫폼입니다. "내 컴퓨터에서는 되는데"라는 말을 없애줍니다.

## 핵심 개념

- **Image**: 실행 환경의 스냅샷 (읽기 전용)
- **Container**: 이미지를 실행한 인스턴스
- **Dockerfile**: 이미지를 만드는 설계도
- **Registry**: 이미지 저장소 (Docker Hub)

## Dockerfile 작성

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
```

## 기본 명령어

```bash
# 이미지 빌드
docker build -t my-app:1.0 .

# 컨테이너 실행
docker run -d -p 3000:3000 --name my-app my-app:1.0

# 실행 중인 컨테이너 확인
docker ps

# 로그 확인
docker logs -f my-app

# 컨테이너 접속
docker exec -it my-app sh

# 정지 및 제거
docker stop my-app && docker rm my-app
```

## Docker Compose

여러 서비스를 한 번에 관리할 때.

```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/mydb
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

```bash
docker compose up -d    # 백그라운드 실행
docker compose down     # 중지
docker compose logs -f  # 로그
```
