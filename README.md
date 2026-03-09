![Trading Narwhal Header](https://capsule-render.vercel.app/api?type=venom&height=305&color=gradient&text=Trading%20Narwhal&section=header&animation=fadeIn&fontAlign=50&fontColor=000000)


# TradingNarwhal

TradingNarwhal is an alpha extraction and benchmarking platform for turning trading ideas into standardized, testable strategies.

The repo accepts strategy input from links, documents, and messaging-style sources, converts that input into executable strategy code, runs a backtest, stores the result, and surfaces the strategy on a leaderboard.

A core point of this project is the use of **Z.ai GLM-5** as the strategy-generation LLM. In the current implementation, the frontend model selector is configured in [`LLM_MODELS`](src/pages/Submit.tsx) and defaults through [`DEFAULT_MODEL`](src/pages/Submit.tsx) inside [src/pages/Submit.tsx](src/pages/Submit.tsx).

---

## Why this project fits the hackathon theme

This repo maps well to the **“claw-for-human”** and **“human-for-claw”** theme:

### Claw-for-human
The system acts as an AI execution layer for people:
- A human submits raw strategy content.
- The app extracts and structures it.
- The LLM converts it into deployable Python strategy logic.
- The backend runs a standardized backtest.
- The user gets validation, metrics, and ranking.

This is visible in the submit flow implemented in [src/pages/Submit.tsx](src/pages/Submit.tsx), the backend backtest path in [server/worker.mjs](server/worker.mjs), and the strategy persistence API in [src/lib/strategiesApi.ts](src/lib/strategiesApi.ts).

### Human-for-claw
The repo is also designed around human-originated signals and conversational input:
- Strategy ideas can come from public URLs, uploaded docs, or messaging-style workflows.
- The product explicitly supports channel attribution such as `Web`, `WhatsApp`, and `OpenClaw` in the [`SourceChannel`](src/data/mockData.ts) type defined in [src/data/mockData.ts](src/data/mockData.ts).
- The integrations screen already frames OpenClaw as a messaging gateway in [src/pages/Integrations.tsx](src/pages/Integrations.tsx).
- The strategy views surface source-channel metadata in [src/pages/Strategies.tsx](src/pages/Strategies.tsx) and [src/pages/StrategyDetail.tsx](src/pages/StrategyDetail.tsx).

In short, humans provide intent, context, and strategy ideas; the “claw” system operationalizes them into structured, benchmarkable trading agents.

---

## What this repo does

TradingNarwhal provides four main functions:

### 1. Strategy ingestion
Users can submit strategy content through the Strategy Builder in [src/pages/Submit.tsx](src/pages/Submit.tsx).

Main capabilities:
- paste a URL
- attach a file
- choose an extraction model
- bind an API key
- generate strategy code from source material

Relevant implementation:
- [`extractSkillMarkdownWith`](src/pages/Submit.tsx)
- [`fetchStrategyTextFromUrl`](src/pages/Submit.tsx)
- [`startExtraction`](src/pages/Submit.tsx)

### 2. LLM-based strategy generation
The project uses **Z.ai GLM-5** as the configured LLM entry in the UI model selector:
- model list: [`LLM_MODELS`](src/pages/Submit.tsx)
- default model: [`DEFAULT_MODEL`](src/pages/Submit.tsx)

The generated output is a Python strategy script with:
- a strategy name
- executable backtest logic
- JSON-safe outputs
- normalized summary and trade summary objects

The prompt and generation pipeline live in [src/pages/Submit.tsx](src/pages/Submit.tsx).

### 3. Backtesting and metric generation
The repo supports two backtest paths:

#### Massive/backend backtest
The frontend calls [`runMassiveBacktest`](src/pages/Submit.tsx), which hits the backend API implemented in [server/worker.mjs](server/worker.mjs) or [server/backtest-proxy.mjs](server/backtest-proxy.mjs).

Routes include:
- `/api/backtest`
- `/api/leaderboard/live`
- `/api/identity`
- `/api/strategies`

#### In-browser Python execution
The Strategy Builder also supports Python execution in-browser through Pyodide in [src/pages/Submit.tsx](src/pages/Submit.tsx), including:
- preset dataset loading
- code execution
- artifact extraction
- summary normalization

This lets users inspect strategy behavior before deployment.

### 4. Ranking, storage, and review
After backtesting, strategies can be stored and shown in:
- leaderboard view: [src/pages/Leaderboard.tsx](src/pages/Leaderboard.tsx)
- strategies list: [src/pages/Strategies.tsx](src/pages/Strategies.tsx)
- strategy detail page: [src/pages/StrategyDetail.tsx](src/pages/StrategyDetail.tsx)

Persistence is handled through:
- [`listStrategies`](src/lib/strategiesApi.ts)
- [`upsertStrategy`](src/lib/strategiesApi.ts)
- [`updateStrategy`](src/lib/strategiesApi.ts)

Metric recomputation is handled by [scripts/recompute-strategy-metrics.mjs](scripts/recompute-strategy-metrics.mjs).

---

## LLM emphasis: Z.ai GLM-5

This repo is built to showcase **GLM-5 from Z.ai** as the intelligence layer that turns messy human strategy descriptions into structured, executable trading logic.

Current configuration in [src/pages/Submit.tsx](src/pages/Submit.tsx):
- displayed model name: `GLM-5`
- provider: `Z.ai`

In product terms, GLM-5 is responsible for:
- understanding raw strategy descriptions
- resolving missing implementation details conservatively
- producing runnable Python strategy code
- preserving human intent while enforcing machine-executable structure

This is the clearest “claw-for-human” component in the repo.

---

## Product flow

### Submit
The user provides a URL, file, or text input in [src/pages/Submit.tsx](src/pages/Submit.tsx).

### Extract
The app fetches content and sends it through the configured LLM using [`extractSkillMarkdownWithOpenAI`](src/pages/Submit.tsx).

### Validate
The app supports review states such as valid, needs-review, and invalid inside [src/pages/Submit.tsx](src/pages/Submit.tsx), matching the multi-path flow described in [.lovable/plan.md](.lovable/plan.md).

### Backtest
The strategy is backtested through the backend route or via the in-browser Python runner.

### Deploy
The resulting strategy is persisted through [`upsertStrategy`](src/lib/strategiesApi.ts) and becomes visible in the leaderboard and strategy detail views.

---

## Architecture

### Frontend
Built with:
- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

Entry files:
- [src/main.tsx](src/main.tsx)
- [src/App.tsx](src/App.tsx)

Primary pages:
- [src/pages/Submit.tsx](src/pages/Submit.tsx)
- [src/pages/Leaderboard.tsx](src/pages/Leaderboard.tsx)
- [src/pages/Strategies.tsx](src/pages/Strategies.tsx)
- [src/pages/StrategyDetail.tsx](src/pages/StrategyDetail.tsx)
- [src/pages/About.tsx](src/pages/About.tsx)
- [src/pages/Integrations.tsx](src/pages/Integrations.tsx)

### Backend
Two server entry points are present:
- [server/worker.mjs](server/worker.mjs)
- [server/backtest-proxy.mjs](server/backtest-proxy.mjs)

These handle:
- backtest requests
- identity/rate-limit flows
- strategy CRUD proxying
- leaderboard data serving

### Data layer
Strategy types are defined in [src/data/mockData.ts](src/data/mockData.ts), including:
- [`Strategy`](src/data/mockData.ts)
- [`SkillProfile`](src/data/mockData.ts)
- [`Trade`](src/data/mockData.ts)
- [`StrategySummary`](src/data/mockData.ts)

---

## Key repository functions

### Strategy extraction and generation
Implemented in [src/pages/Submit.tsx](src/pages/Submit.tsx):
- [`fetchStrategyTextFromUrl`](src/pages/Submit.tsx)
- [`extractSkillMarkdownWithOpenAI`](src/pages/Submit.tsx)
- [`parseResponsesText`](src/pages/Submit.tsx)
- [`unwrapMarkdownFence`](src/pages/Submit.tsx)

### Backtest execution
Implemented in [src/pages/Submit.tsx](src/pages/Submit.tsx):
- [`runMassiveBacktest`](src/pages/Submit.tsx)
- Python/Pyodide execution pipeline around [`runPythonStrategy`](src/pages/Submit.tsx)

### Strategy persistence
Implemented in [src/lib/strategiesApi.ts](src/lib/strategiesApi.ts):
- [`getIdentity`](src/lib/strategiesApi.ts)
- [`listStrategies`](src/lib/strategiesApi.ts)
- [`upsertStrategy`](src/lib/strategiesApi.ts)
- [`updateStrategy`](src/lib/strategiesApi.ts)

### Backend synthetic and live support
Implemented in [server/worker.mjs](server/worker.mjs):
- benchmark detection
- synthetic backtest generation
- identity and rate-limit handling
- leaderboard/live data support

### Metrics maintenance
Implemented in [scripts/recompute-strategy-metrics.mjs](scripts/recompute-strategy-metrics.mjs):
- recomputes `hwm`
- recomputes `maxdrawdown`
- recomputes `sharpe`

---

## OpenClaw and messaging relevance

This repo is especially suitable for a Claw-themed hackathon because it already models strategy intake as a messaging and human-interface problem.

Evidence in the codebase:
- OpenClaw integration framing in [src/pages/Integrations.tsx](src/pages/Integrations.tsx)
- source-channel support via [`SourceChannel`](src/data/mockData.ts) in [src/data/mockData.ts](src/data/mockData.ts)
- channel badges in [src/pages/Strategies.tsx](src/pages/Strategies.tsx)
- submission provenance display in [src/pages/StrategyDetail.tsx](src/pages/StrategyDetail.tsx)

This means the repo can be presented as:
- an AI claw that helps humans operationalize ideas
- a human input layer that feeds Claw through chat, messages, and shared public content

---

## Local development

### Requirements
- Node.js
- npm

Version management:
- [.nvmrc](.nvmrc)

### Install
```sh
npm i
```

### Start frontend
```sh
npm run dev
```

### Start backend proxy
```sh
npm run backend:dev
```

### Start Cloudflare worker locally
```sh
npm run backend:cf:dev
```

### Deploy Cloudflare worker
```sh
npm run backend:cf:deploy
```

Package scripts are defined in [package.json](package.json).

---

## Environment setup

Environment files in the repo:
- [.env.development](.env.development)
- [.env.production](.env.production)
- [.dev.vars.example](.dev.vars.example)
- [wrangler.toml](wrangler.toml)

Typical required values:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MASSIVE_API_KEY`

The Supabase table defaults are used by the backend and recompute script. See:
- [server/worker.mjs](server/worker.mjs)
- [server/backtest-proxy.mjs](server/backtest-proxy.mjs)
- [scripts/recompute-strategy-metrics.mjs](scripts/recompute-strategy-metrics.mjs)

---

## Supabase

Strategy storage is backed by Supabase.

Frontend API client:
- [src/lib/strategiesApi.ts](src/lib/strategiesApi.ts)

Backend route handlers:
- [server/worker.mjs](server/worker.mjs)
- [server/backtest-proxy.mjs](server/backtest-proxy.mjs)

SQL setup:
- [supabase/strategies.sql](supabase/strategies.sql)

---

## UI overview

### Leaderboard
[Leaderboard](src/pages/Leaderboard.tsx) shows:
- rank
- strategy/model
- account value
- return
- total P&L
- fees
- win rate
- high water mark
- additional metadata

### Strategies
[Strategies](src/pages/Strategies.tsx) shows:
- strategy cards
- owner-aware actions
- source-channel badges
- Sharpe and trade counts

### Strategy Detail
[StrategyDetail](src/pages/StrategyDetail.tsx) shows:
- account metrics
- source-channel provenance
- skill profile
- summary metrics for user-deployed strategies

### Submit
[Submit](src/pages/Submit.tsx) is the main demo path for the hackathon:
- input
- extraction
- validation
- Python execution
- deployment
- result export

---

## Why this repo is a strong hackathon demo

This project demonstrates a complete human-to-agent loop:

1. A person shares a strategy idea.
2. GLM-5 interprets and structures it.
3. The system backtests it under standardized rules.
4. The result becomes portable, reviewable, and rankable.
5. Messaging channels and OpenClaw-style ingestion make the experience collaborative and conversational.

That directly supports the idea of building tools where:
- **AI works for people**
- **people provide the intent that powers AI systems**

---

## Suggested pitch

**TradingNarwhal uses Z.ai GLM-5 to turn human trading ideas from links, docs, and chat-style inputs into executable strategies, standardized backtests, and leaderboard-ready results. It embodies “claw-for-human” by giving users an AI operator for strategy deployment, and “human-for-claw” by treating human conversation, messaging, and public content as the input layer that drives the system.**

---

## Repo structure

- [src/](src)
- [server/](server)
- [scripts/](scripts)
- [public/](public)
- [supabase/](supabase)
- [README.md](README.md)

---

## Notes
- The frontend branding and product narrative are visible in [src/pages/About.tsx](src/pages/About.tsx).
- The app shell is bootstrapped from [index.html](index.html).
- Styling is configured in [tailwind.config.ts](tailwind.config.ts), [src/index.css](src/index.css), and [src/App.css](src/App.css).
