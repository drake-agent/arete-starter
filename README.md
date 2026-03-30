# ARETE Starter

AI Operating System — set up in 5 minutes.

## Quick Start

```bash
npx create-arete-workspace
```

## What's Included

- **Eve**: AI Chief of Staff (Telegram integration)
- **사주 기반 코칭**: 온보딩에서 생년월일시 입력 → 명리 공명 프레임워크로 맞춤 운영 매뉴얼 자동 생성
- **Memory Bridge**: Auto-integrate knowledge across agents
- **FORGE Workflow**: Coding agent + 3-Mode (Full Build / Upgrade / QA)
- **Compound Knowledge**: 코딩 경험 자동 축적 (confidence decay + cross-project)
- **Verify Loop**: Automatic implementation verification
- **Tracer Agent**: Evidence-based bug causal tracking

## 갓생OS

Neuroscience-based habit & productivity dashboard powered by Obsidian.

- **Dashboard**: Routines, goals, D-day, energy tracking, focus timer
- **Obsidian Vault Backend**: All data stored as markdown with frontmatter
- **Neuroscience Engine**: Ultradian rhythm scoring, habit stacking, Zeigarnik tracking
- **Voice AI**: Eve voice assistant integration (OpenAI)
- **Review System**: Weekly/monthly plan & retrospective

```bash
# Launch 갓생OS dashboard
arete start
```

Runs on `http://localhost:3000` (Next.js dev server). Requires `VAULT_PATH` pointing to your Obsidian vault.

## Architecture

```
Layer 1 (Framework) — updated via `arete update`
├── scripts/          Session indexer, tracer, forge tools
└── templates/        System templates

Layer 2 (User Config) — NEVER auto-updated
├── SOUL.md           Agent personality & behavior
├── AGENTS.md         Agent routing & policies
├── MEMORY.md         Persistent memory
├── USER.md           User profile & preferences
├── TOOLS.md          Local environment config
├── HEARTBEAT.md      Health monitoring rules
└── BOOTSTRAP.md      Session startup protocol
```

## Commands

```bash
# Initial setup
npx create-arete-workspace

# Check status
arete status

# Launch 갓생OS dashboard
arete start

# Update framework only (config files protected)
arete update
```

## Update Safety

`arete update` only touches Layer 1 files (scripts, templates). Your personal configuration files (SOUL.md, AGENTS.md, MEMORY.md, USER.md, etc.) are never modified during updates.

## Changelog

### v0.3.0
- **AGENTS.md**: Added "Find the Strategic Crux" 5-step process in Plan-CEO Review
- **AGENTS.md**: Added `[TLDR]` command trigger for executive summaries
- **AGENTS.md**: Added ACCEPTANCE CRITERIA (Given/When/Then) to spawn prompt template
- **AGENTS.md**: Added Memory Bridge rules (read-before-write, cross-agent awareness, conflict resolution, staleness guard)
- **SOUL.md**: Confrontation Rule, Accountability Rule, Upgrade Rule confirmed present
- Removed hardcoded personal info from packages/ (genericized for starter kit)

### v0.2.0
- Initial public release with full ARETE workspace templates
- 갓생OS dashboard with neuroscience engine
- FORGE workflow, Tracer agent, Memory Bridge, session indexer

### v0.1.0
- Project scaffolding and CLI setup

## Requirements

- Node.js 18+
- Python 3.10+
- macOS or Linux
