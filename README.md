# ARETE Starter

AI Operating System — set up in 5 minutes.

**Supports: OpenClaw and Hermes (Anthropic)**

## Quick Start

```bash
npx create-arete-workspace
```

The setup wizard will ask you to choose a runtime:
- **OpenClaw** — multi-agent architecture with sub-agent spawning
- **Hermes (Anthropic)** — single-agent with delegate_task, native Telegram, cron system

## What's Included

- **Eve**: AI Chief of Staff (Telegram integration)
- **사주 기반 코칭**: 온보딩에서 생년월일시 입력 → 명리 공명 프레임워크로 맞춤 코칭
- **Personality Engine**: Choose soft, direct, or custom personality style — generates SOUL.md on first run
- **Memory Bridge**: Auto-integrate knowledge across agents
- **FORGE Workflow**: Coding agent + 3-Mode (Full Build / Upgrade / QA)
- **Compound Knowledge**: 코딩 경험 자동 축적 (confidence decay + cross-project)
- **Verify Loop**: Automatic implementation verification
- **Tracer Agent**: Evidence-based bug causal tracking
- **Knowledge Trust Layer**: Wiki pages with `explored` + `bias_check` metadata for confidence tracking
- **Personal KB Pipeline**: Full signal → normalized → intel → wiki automated knowledge flow
- **Runtime Contract**: Model-adaptive behavior (GPT/Codex vs Claude) for consistent quality
- **Quick-Fire Coding**: 1-sentence task → instant coding agent spawn, no planning overhead
- **Meta Harness Observer**: Self-monitoring layer for agent routing and performance

## Hermes Quick Start

```bash
# 1. Create workspace (select "Hermes" runtime)
npx create-arete-workspace

# 2. Generate personalized SOUL.md
arete generate-soul

# 3. Set up pipeline cron jobs
arete setup-crons

# 4. Start chatting on Telegram — Hermes handles the connection
```

Hermes uses `~/.hermes/config.yaml` for configuration. The workspace generates:
- Hermes-specific templates (AGENTS.md, BOOTSTRAP.md, TOOLS.md, HEARTBEAT.md)
- Cron setup script at `scripts/setup-hermes-crons.sh`
- Personality seed for SOUL.md generation
- Saju profile (if enabled) for personality integration

## OpenClaw Quick Start

```bash
# 1. Create workspace (select "OpenClaw" runtime)
npx create-arete-workspace

# 2. Start OpenClaw
openclaw start

# 3. Find your bot on Telegram and send /start
```

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

## Personal KB Pipeline

Automated knowledge building from raw signals to actionable intelligence:

```
Signals (chat/meeting/schedule/voice)
  → build_normalized.py (unified daily JSONL)
  → Intel Agent (nightly analysis → intel/YYYY-MM-DD.json)
  → Wiki Compiler (auto wiki pages with explored/bias_check)
  → Quality Gate (wiki health check)
  → Pre-brief (meeting prep dossiers)
  → Morning Direction (actionable daily brief)
  → Evening Close (daily wrap + open loop tracking)
```

Each wiki page carries `explored` (discovery confidence) and `bias_check` (verification status) metadata, forming a **Knowledge Trust Layer** that prevents stale or unverified information from reaching decision points.

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

# Check status (auto-detects runtime)
arete status

# Launch 갓생OS dashboard
arete start

# Update framework only (config files protected)
arete update

# Hermes: set up cron jobs
arete setup-crons

# Generate personalized SOUL.md
arete generate-soul
```

## Update Safety

`arete update` only touches Layer 1 files (scripts, templates). Your personal configuration files (SOUL.md, AGENTS.md, MEMORY.md, USER.md, etc.) are never modified during updates.

## Changelog

### v0.4.0
- **Hermes Runtime**: Added Hermes (Anthropic) as alternative to OpenClaw
- **Personality Engine**: Choose soft, direct, or custom personality — SOUL.md generated via LLM prompt
- **Saju Profiling**: Optional 사주 personality profiling with birth data
- **Hermes Templates**: AGENTS.md, BOOTSTRAP.md, TOOLS.md, HEARTBEAT.md optimized for Hermes
- **Cron Setup**: Auto-generated `setup-hermes-crons.sh` for pipeline scheduling
- **New Commands**: `arete setup-crons`, `arete generate-soul`
- **Runtime Detection**: `arete status` auto-detects OpenClaw vs Hermes

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
- **OpenClaw runtime**: OpenClaw CLI installed
- **Hermes runtime**: Hermes CLI + `~/.hermes/config.yaml`
