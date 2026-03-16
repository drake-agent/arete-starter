# ARETE Starter

AI Operating System — set up in 5 minutes.

## Quick Start

```bash
npx create-arete-workspace
```

## What's Included

- **Eve**: AI Chief of Staff (Telegram integration)
- **Memory Bridge**: Auto-integrate knowledge across agents
- **FORGE Workflow**: Coding agent + Impact Map
- **Verify Loop**: Automatic implementation verification
- **Tracer Agent**: Evidence-based bug causal tracking

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

# Update framework only (config files protected)
arete update
```

## Update Safety

`arete update` only touches Layer 1 files (scripts, templates). Your personal configuration files (SOUL.md, AGENTS.md, MEMORY.md, USER.md, etc.) are never modified during updates.

## Requirements

- Node.js 18+
- Python 3.10+
- macOS or Linux
