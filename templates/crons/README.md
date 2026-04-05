# Cron Jobs — ARETE Workspace

This directory documents the recommended cron schedule for the ARETE personal KB pipeline.
All jobs are optional — the system degrades gracefully if any job is disabled.

---

## Quick Setup

Add to your crontab (`crontab -e`). Replace `WORKSPACE` with your actual workspace path
and `OPENCLAW` with your OpenClaw path.

```
WORKSPACE=/path/to/your/workspace
OPENCLAW=/path/to/.openclaw
```

---

## Full Schedule

| Time (local) | Job | Script / Command | Notes |
|---|---|---|---|
| Every 2h | Session Auto-Indexer | `python $WORKSPACE/scripts/session_indexer.py` | Indexes agent sessions into daily memory |
| 01:00 | PersonalKB Intel | `openclaw run intel` | Reads normalized signals → extracts themes, decisions, open loops |
| 01:30 | Wiki Compiler | `openclaw run wiki` | Applies intel WIKI_INSTRUCTIONs → updates wiki files |
| 01:40 | Wiki Quality Gate | `python $WORKSPACE/scripts/wiki_quality_check.py` | Checks broken links, placeholders; exit 2 = broken |
| 08:00 | PersonalKB Pre-brief | `openclaw run prebrief-review` | Generates meeting pre-briefs from schedule signals |
| 08:30 | Morning Direction | `openclaw run morning-direction-v2` | Synthesizes pipeline output → actionable morning brief |

---

## Job Details

### Session Auto-Indexer (every 2 hours)
```cron
0 */2 * * * cd $WORKSPACE && python scripts/session_indexer.py >> logs/session_indexer.log 2>&1
```
- Reads recent agent sessions and appends summaries to `memory/YYYY-MM-DD.md`
- Safe to run frequently — deduplicates by session ID
- Required for downstream intel to have up-to-date signals

---

### PersonalKB Intel (01:00)
```cron
0 1 * * * openclaw run intel >> $WORKSPACE/logs/intel.log 2>&1
```
- Reads `data/normalized/*.jsonl` from last 7 days
- Extracts themes, decisions, open loops, people updates
- Writes structured Intel section to today's daily log
- Promotes `approved` query filings to wiki instructions
- **Prerequisite**: `build_normalized.py` should run before this (or inline)

To run normalization inline:
```cron
50 0 * * * cd $WORKSPACE && WORKSPACE_PATH=$WORKSPACE python scripts/build_normalized.py >> logs/normalized.log 2>&1
0  1 * * * openclaw run intel >> $WORKSPACE/logs/intel.log 2>&1
```

---

### Wiki Compiler (01:30)
```cron
30 1 * * * openclaw run wiki >> $WORKSPACE/logs/wiki.log 2>&1
```
- Reads Intel output from today's daily log
- Creates/upserts wiki files per `WIKI_INSTRUCTION` entries
- Updates `wiki/_index.md`, `wiki/_changelog.md`, `wiki/people/_index.md`
- **Prerequisite**: Intel job (01:00) must complete first

---

### Wiki Quality Gate (01:40)
```cron
40 1 * * * cd $WORKSPACE && WORKSPACE_PATH=$WORKSPACE WIKI_DIR=$WORKSPACE/wiki python scripts/wiki_quality_check.py >> logs/quality.log 2>&1
```
- Checks for broken links (exit 2 = blocking), placeholders (exit 1 = warning)
- Writes JSON report to `data/quality/YYYY-MM-DD.json` if `REPORT_PATH` is set
- Output is a 4-block card: 완료 / 진행 / 대기 / 다음
- Exit code 1 (warnings) does NOT block the pipeline
- Exit code 2 (broken links) should alert the user

To capture the quality report:
```cron
40 1 * * * cd $WORKSPACE && WORKSPACE_PATH=$WORKSPACE WIKI_DIR=$WORKSPACE/wiki REPORT_PATH=$WORKSPACE/data/quality/$(date +\%Y-\%m-\%d).json python scripts/wiki_quality_check.py >> logs/quality.log 2>&1
```

---

### PersonalKB Pre-brief (08:00)
```cron
0 8 * * * openclaw run prebrief-review >> $WORKSPACE/logs/prebrief.log 2>&1
```
- Reads `schedule-signals/YYYY-MM-DD.md` for today's meetings
- Pulls attendee wiki profiles and relevant decisions
- Writes one pre-brief card per meeting
- **If no meetings**: outputs `NO_REPLY` and exits cleanly (no error)
- **Prerequisite**: `build_schedule_signals.py` should run before 08:00

To run schedule signals before pre-brief:
```cron
45 7 * * * cd $WORKSPACE && WORKSPACE_PATH=$WORKSPACE python scripts/build_schedule_signals.py >> logs/schedule.log 2>&1
0  8 * * * openclaw run prebrief-review >> $WORKSPACE/logs/prebrief.log 2>&1
```

---

### Morning Direction (08:30)
```cron
30 8 * * * openclaw run morning-direction-v2 >> $WORKSPACE/logs/morning.log 2>&1
```
- Synthesizes: intel + wiki state + schedule + pending items → morning brief
- Output: 4-block card (완료 / 진행 / 대기 / 다음)
- Includes Today's Focus (top 3), meetings, open loops, wiki health
- **Prerequisite**: Intel (01:00), Wiki Compiler (01:30), Pre-brief (08:00)
- v2 note: grounded in compiled wiki, not just raw memory

---

## Graceful Degradation Matrix

| Source missing | Affected jobs | Behavior |
|---|---|---|
| No calendar source | Pre-brief, Morning Direction | Pre-brief → `NO_REPLY`; Morning Direction notes "No calendar" |
| No meeting signals | Pre-brief | → `NO_REPLY` |
| No normalized data | Intel | → `NO_DATA` logged |
| No wiki yet | Quality Gate, Morning Direction | Quality gate exits 0; Morning Direction notes "Wiki not yet populated" |
| Intel failed | Wiki Compiler | → `NO_INSTRUCTIONS — wiki compiler idle` |
| Wiki Compiler failed | Quality Gate | Quality gate scans what's there; may exit 0 if wiki is empty |

---

## Logs

All jobs write to `$WORKSPACE/logs/`. Recommended rotation:
```cron
0 3 * * 0 find $WORKSPACE/logs -name "*.log" -mtime +30 -delete
```

---

## Notes

- Adjust times to your local timezone. The schedule above uses local time.
- Jobs are independent — any single job failure does not break others.
- Obsidian is not required — all pipeline reads/writes use plain markdown files.
- To disable a job: simply remove or comment out the crontab line.
- To test a job manually: run the command directly from your terminal.
