---
title: "Git 기초 명령어 정리"
description: "개발자라면 반드시 알아야 할 Git 기본 명령어와 워크플로우를 정리합니다. init, add, commit, branch, merge 등 핵심 명령어를 다룹니다."
pubDate: 2026-02-15
tags: ["Programming", "DevOps"]
---

## Git이란?

Git은 분산 버전 관리 시스템(DVCS)으로, 코드의 변경 이력을 추적하고 협업을 가능하게 해주는 도구입니다.

## 기본 워크플로우

```
작업 디렉토리 → 스테이징 영역 → 로컬 저장소 → 원격 저장소
   (edit)      (git add)     (git commit)   (git push)
```

## 필수 명령어

### 저장소 초기화

```bash
# 새 저장소 생성
git init

# 원격 저장소 복제
git clone https://github.com/user/repo.git
```

### 변경사항 관리

```bash
# 상태 확인
git status

# 변경사항 스테이징
git add 파일명        # 특정 파일
git add .            # 모든 변경사항

# 커밋
git commit -m "커밋 메시지"

# 변경 이력 확인
git log --oneline
```

### 브랜치

```bash
# 브랜치 목록
git branch

# 새 브랜치 생성 및 이동
git checkout -b feature/login

# 브랜치 전환
git checkout main

# 브랜치 병합
git merge feature/login
```

### 원격 저장소

```bash
# 원격 저장소 추가
git remote add origin https://github.com/user/repo.git

# 푸시
git push origin main

# 풀 (원격 변경사항 가져오기)
git pull origin main
```

## 커밋 메시지 컨벤션

좋은 커밋 메시지는 협업에서 매우 중요합니다.

```
feat: 로그인 기능 추가
fix: 회원가입 유효성 검사 버그 수정
docs: README 업데이트
refactor: 유저 서비스 코드 리팩토링
style: 코드 포맷팅
test: 로그인 테스트 추가
```

## .gitignore

추적하지 않을 파일을 지정합니다.

```
node_modules/
.env
.DS_Store
dist/
```

## 자주 쓰는 꿀팁

```bash
# 마지막 커밋 메시지 수정
git commit --amend -m "새 메시지"

# 스테이징 취소
git reset HEAD 파일명

# 변경사항 임시 저장
git stash
git stash pop

# 특정 커밋으로 되돌리기
git revert 커밋해시
```

Git은 처음에 어렵게 느껴질 수 있지만, 기본 명령어만 잘 익히면 점점 자연스럽게 사용할 수 있습니다!
