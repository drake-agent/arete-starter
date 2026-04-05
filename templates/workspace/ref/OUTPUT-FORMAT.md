# OUTPUT-FORMAT.md — Standard Output Format Guide

> Load this file when formatting status reports, briefings, quality gates, or pipeline closings.
> **Not auto-injected** — read on demand via `AGENTS.md § On-Demand File Routing`.

---

## Standard 4-Block Card

All status reports, briefings, closings, and quality gate outputs use this structure.

```
## 완료
- {what was completed}

## 진행
- {what is currently in progress}

## 대기
- {what is blocked or waiting on input}

## 다음
- {recommended next action}
```

### Rules

1. **Always include all 4 blocks** — if a block has nothing to say, write `Nothing to report`.
2. **No internal log exposure** — never dump raw logs or tool output into user-facing messages.
3. **Compress, don't pad** — each item should be 1-2 lines maximum.
4. **완료 = done and closed** — only include items that are fully complete.
5. **대기 = blocked** — items waiting on user decision or external dependency, not just "not started".
6. **다음 = immediately actionable** — the next action should be specific and executable.

---

## When to Use This Format

| Context | Use 4-block? |
|---------|-------------|
| Session closing / end-of-work summary | Yes |
| Pipeline job completion (intel, wiki, quality gate) | Yes |
| Morning direction brief | Yes |
| Pre-brief cards | No — use pre-brief card format |
| Quick answers (<3 sentences) | No — skip the structure |
| Error reports | Yes (완료=none, 진행=none, 대기=error detail, 다음=fix suggestion) |

---

## Examples

### Good: Morning Direction closing
```
## 완료
- Overnight pipeline: intel ✓ / wiki compiler ✓ / quality gate: 1 warning

## 진행
- Today's focus: finalize Q2 plan (due Friday), review vendor proposal, 1-on-1 prep

## 대기
- Q2 budget approval — waiting on finance team (since 2024-03-01)

## 다음
- Open the Q2 plan doc and complete the resource section before the 10am meeting
```

### Good: Quality gate output
```
## 완료
- 24 files scanned, 21 clean

## 진행
- 2 placeholder articles (people/contacts/alex.md, insights/q1-patterns.md)

## 대기
- 1 broken link: decisions/team-structure.md → people/collaborators/jamie.md (file missing)

## 다음
- Create people/collaborators/jamie.md stub, then rerun wiki_quality_check.py
```

### Bad: Do not do this
```
Processing complete. I have finished analyzing all of the files and found that
there were some issues. Let me summarize what happened during the process...
[300 lines of log output]
```

---

## Block Vocabulary

| Block | Korean | Meaning |
|-------|--------|---------|
| 완료 | 完了 | Done and closed |
| 진행 | 進行 | In progress / active |
| 대기 | 待機 | Waiting / blocked |
| 다음 | 다음 | Next action |

These four words are used consistently across all ARETE pipeline outputs
so users can scan output at a glance without reading each block header carefully.
