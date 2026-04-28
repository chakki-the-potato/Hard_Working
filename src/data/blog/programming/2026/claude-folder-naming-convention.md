---
title: ".claude 폴더 이름 규칙 — skills인가, skill인가"
description: "Claude Code의 .claude 디렉토리 안 폴더 이름은 agents, commands, skills처럼 항상 복수형을 사용합니다. 각 폴더의 내부 구조와 적용 범위를 정리합니다."
pubDate: 2026-04-27
category: programming
tags: ["Claude Code"]
---

`.claude` 디렉토리는 Claude Code가 프로젝트별 설정과 도구를 읽어오는 곳입니다. 공식 문서와 실제 동작 방식을 보면 폴더 이름에 일관된 규칙이 있습니다. `skill`인지 `skills`인지, `agent`인지 `agents`인지 헷갈릴 수 있는데, 답은 하나입니다.

## 공식 규칙: 항상 복수형

Claude Code가 인식하는 폴더 이름은 모두 복수형입니다.

| 폴더 | 용도 |
|------|------|
| `.claude/agents/` | 서브에이전트 정의 파일 |
| `.claude/commands/` | 슬래시 커맨드 정의 파일 |
| `.claude/skills/` | 스킬 정의 디렉토리 |

단수형 폴더(`skill/`, `agent/`)는 Claude Code가 인식하지 못합니다. 오타나 혼동으로 단수형 폴더를 만들면 해당 기능이 아무 효과 없이 조용히 무시됩니다.

## 내부 구조 차이

컬렉션 폴더 안의 구조는 기능마다 다릅니다.

### agents/ — 단일 파일 방식

```text
.claude/agents/
  code-reviewer.md
  test-writer.md
```

각 에이전트는 `.md` 파일 하나입니다. 파일 이름이 곧 에이전트 이름이 됩니다.

### commands/ — 단일 파일 방식

```text
.claude/commands/
  deploy.md
  test-all.md
```

각 커맨드도 `.md` 파일 하나입니다. `/deploy`, `/test-all` 식으로 호출됩니다.

### skills/ — 하위 디렉토리 방식

```text
.claude/skills/
  blog-draft/
    SKILL.md
  code-review/
    SKILL.md
```

스킬만 유일하게 **하위 디렉토리 + SKILL.md** 구조를 사용합니다. 파일 이름은 반드시 `SKILL.md`(대문자)여야 합니다.

## 글로벌 vs 프로젝트 범위

각 폴더는 두 위치에 둘 수 있습니다.

| 위치 | 범위 |
|------|------|
| `~/.claude/agents/` | 모든 프로젝트에서 사용 가능 |
| `.claude/agents/` | 해당 프로젝트에서만 사용 가능 |

`commands/`, `skills/`도 동일합니다. 자주 쓰는 범용 도구는 홈 디렉토리에, 프로젝트 특화 도구는 레포 안에 두면 됩니다.

## Hooks는 폴더가 없다

`hooks/`라는 폴더는 없습니다. 훅은 `settings.json`의 `hooks` 키로 설정합니다.

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "echo 'bash called'" }]
      }
    ]
  }
}
```

폴더 방식이 아니라 설정 파일 방식이라는 점이 다른 기능들과 다릅니다.

## 정리

- **복수형**만 인식: `agents/`, `commands/`, `skills/`
- `skills/`만 하위 디렉토리 + `SKILL.md` 구조를 사용
- `hooks/`는 폴더가 아니라 `settings.json`으로 설정
