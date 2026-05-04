---
title: "git branch는 포인터, git worktree는 작업 공간 — 언제 무엇을 쓸까"
description: "git branch와 git worktree의 내부 동작 차이를 살펴보고, 동시에 여러 브랜치를 체크아웃해야 하는 상황에서 worktree가 어떻게 context switching 비용을 줄여주는지 정리합니다."
pubDate: 2026-05-04T23:28:41+09:00
category: programming
tags: ["Git"]
version: "v1.0"
---

feature 브랜치 작업 한창 중에 긴급 hotfix 요청이 들어오면 꽤 곤란합니다. 현재 작업을 `git stash`로 치워두고 브랜치를 바꿨다가, 에디터가 파일 변경을 인식하는 사이 멘탈이 흐트러지는 경험 한 번쯤은 있으실 겁니다. 또는 두 가지 구현 방향을 나란히 띄워놓고 비교하고 싶을 때도 마찬가지고요.

`git worktree`는 이런 상황을 위해 Git 2.5에서 조용히 추가된 기능입니다. branch와 worktree가 정확히 무엇이 다른지, 그리고 언제 worktree를 꺼내야 하는지 정리해봤습니다.

## git branch는 사실 커밋을 가리키는 파일 하나다

브랜치를 "별도 히스토리 선상"으로 비유하는 경우가 많은데, 실제 Git 내부는 훨씬 단순합니다. 브랜치는 특정 커밋 SHA를 담고 있는 40바이트짜리 텍스트 파일입니다.

```bash
cat .git/refs/heads/main
# a3f4b21d9e7c3b0f1a2e5d6c4b8f9e0a1b2c3d4e
```

`git switch feature-branch`를 실행하면 Git이 하는 일은 이렇습니다.

1. `.git/HEAD`를 새 브랜치로 업데이트 (`ref: refs/heads/feature-branch`)
2. 새 브랜치가 가리키는 커밋 트리로 working directory 갱신
3. staging area(index)를 새 상태에 맞게 업데이트

이 세 단계 동안 파일 시스템은 뒤집히고, 에디터는 파일 변경을 감지하고, 언어 서버는 재인덱싱을 시작합니다. 빠르긴 하지만 **한 저장소 디렉토리에 한 번에 하나의 브랜치**라는 한계는 구조적으로 피할 수 없습니다.

## git worktree는 동일한 저장소를 여러 디렉토리에서 열어두는 것

`git worktree add`는 새 디렉토리를 만들고 그 안에 원하는 브랜치를 체크아웃합니다. 이 디렉토리는 기존 클론과 **오브젝트 저장소(`.git/objects/`)와 remote 정보를 공유**하지만, HEAD와 working directory와 staging area는 독립적입니다.

```bash
# 현재 디렉토리: ~/my-repo (main 브랜치)

# hotfix 브랜치를 별도 디렉토리에 체크아웃
git worktree add ../my-repo-hotfix hotfix/critical-bug

# 목록 확인
git worktree list
# /home/user/my-repo          a3f4b21 [main]
# /home/user/my-repo-hotfix   c7d8e92 [hotfix/critical-bug]
```

두 디렉토리는 IDE에서 각자 다른 프로젝트처럼 열 수 있고, 한쪽에서 커밋하면 공유된 오브젝트 저장소에 바로 반영됩니다. stash도 없고, 브랜치 전환도 없습니다.

## 내부 구조가 어떻게 다른가

브랜치는 파일 하나로 표현됩니다.

```text
.git/
  refs/
    heads/
      main              ← 커밋 SHA 텍스트
      feature-branch    ← 커밋 SHA 텍스트
```

linked worktree는 별도 디렉토리 안에 `.git` **파일**(폴더가 아님)을 두고, 메인 저장소의 worktree 전용 메타데이터 폴더를 가리킵니다.

```text
my-repo-hotfix/
  .git            ← 파일, 내용: "gitdir: /home/user/my-repo/.git/worktrees/my-repo-hotfix"

my-repo/.git/
  worktrees/
    my-repo-hotfix/
      HEAD          ← 이 worktree의 현재 브랜치
      index         ← 이 worktree의 staging area
      gitdir        ← linked .git 파일 위치
```

오브젝트 저장소(`.git/objects/`)는 공유되므로 같은 커밋을 두 번 저장하지 않습니다. 디스크 추가 사용량은 working directory 파일들 크기만큼뿐입니다.

## 어떤 상황에 worktree가 유용한가

| 상황 | branch 전환 방식 | worktree 방식 |
|---|---|---|
| feature 중 긴급 hotfix | stash → switch → 작업 → switch → pop | worktree add, 별도 디렉토리에서 독립 작업 |
| 두 구현 방향 나란히 비교 | 메모리 또는 diff에 의존 | IDE 두 창으로 나란히 열기 |
| 장시간 빌드 중 다른 작업 | 빌드 완료까지 대기 | 다른 worktree에서 자유롭게 |
| 코드 리뷰 중 현재 작업 유지 | 작업 commit 또는 stash | 리뷰용 worktree 별도 생성 |

저는 특히 "빌드 도중 별도 작업"과 "PR 리뷰"에서 worktree를 자주 씁니다. 빌드가 돌아가는 동안 메인 working directory는 건드리지 않고 리뷰 브랜치를 다른 디렉토리에서 열어두는 방식이 꽤 편하더라고요.

## 주의해야 할 것들

**같은 브랜치는 두 worktree에 동시 체크아웃 불가**합니다. 시도하면 Git이 바로 막습니다.

```bash
git worktree add ../another main
# fatal: 'main' is already checked out at '/home/user/my-repo'
```

**worktree 제거는 `rm -rf`로 충분하지 않습니다.** 디렉토리만 지우면 `.git/worktrees/` 안에 메타데이터가 남습니다.

```bash
# 올바른 제거
git worktree remove ../my-repo-hotfix

# 또는 디렉토리를 이미 지웠다면
git worktree prune
```

**bare repository와의 조합**도 알아두면 좋습니다. `git clone --bare`로 만든 저장소는 working directory 없이 오브젝트 저장소만 갖습니다. 여기에 worktree를 붙이면 "중앙 저장소에 여러 체크아웃"을 깔끔하게 관리할 수 있어서 서버 배포 스크립트나 모노레포 운영에 쓰이기도 합니다.

## 정리

branch는 개념(커밋을 가리키는 포인터)이고, worktree는 물리적 작업 공간입니다. 두 개념이 직접 경쟁하는 관계는 아니지만, 브랜치 전환 비용이 높아지는 시점에 worktree가 실질적인 대안이 됩니다.

`git stash`를 습관적으로 쓰고 있다면 worktree가 더 나은 선택인 상황인지 한 번 돌아볼 만합니다.

## 참고 자료

- [git-worktree 공식 문서](https://git-scm.com/docs/git-worktree)
- Git 2.5 릴리즈 노트 (2015) — worktree 기능 최초 도입
