# P1 AI Backend — Design Spec

**Date:** 2026-03-28
**Branch:** `feature/p1-ai-backend`
**Owner:** Person 1
**Status:** Approved

---

## Overview

Build an Express relay server that sits between the React Native app and Google's Gemini Live API. The server handles manual lookup, guide synthesis, voice+vision relay, and tool calls.

**Scope:** Happy path only. No error recovery, no auth, no edge cases.

---

## Architecture

```
React Native App ←WebSocket→ Express Relay Server ←WebSocket→ Gemini Live API
                                     ↕
                                  Supabase
                              (devices + sessions)
```

### Happy Path Flow

1. App opens WebSocket to Express server, sends `{ deviceId: "IKEA-MALM-..." }`
2. Server fetches full manual text from `devices` table in Supabase
3. Server calls `gemini-3-flash` to synthesize a structured `GuideJSON` from the manual text
4. Server emits `onGuideReady(guide)` to the app
5. Server opens Gemini Live WebSocket with manual text injected as system context
6. Audio/frames relay bidirectionally between app and Gemini via the server
7. Gemini tool calls relayed as `onToolCall` events to the app
8. Session ends → server logs to `sessions` table, emits `onSessionEnd`

---

## File Structure

```
src/
├── ai/
│   ├── mockSession.ts          # (existing) fake session for P2/P3 dev
│   ├── supabaseClient.ts       # Supabase connection init
│   ├── ingestManual.ts         # CLI script: PDF → extract text → save to devices table
│   ├── guideSynthesis.ts       # Manual text → GuideJSON via gemini-3-flash
│   ├── geminiSession.ts        # Gemini Live WebSocket manager
│   ├── toolDeclarations.ts     # Tool schemas for Gemini (3 tools)
│   └── sessionLogger.ts        # Write session start/end to Supabase sessions table
├── server/
│   ├── index.ts                # Express + WebSocket server entry point
│   └── sessionHandler.ts       # Orchestrates: lookup → synthesize → relay → log
├── types/
│   ├── guide.ts                # (existing) GuideJSON, Part, Tool, Step interfaces
│   └── guide.mock.ts           # (existing) IKEA MALM mock data
```

---

## Database Schema

Two tables. No pgvector, no embeddings — the full manual text fits in Gemini's context window.

```sql
create table devices (
  id          text primary key,        -- e.g. "IKEA-MALM-AA2301456"
  name        text not null,           -- e.g. "IKEA MALM 6-drawer dresser"
  brand       text,
  manual_url  text,
  manual_text text,                    -- full extracted PDF text
  created_at  timestamptz default now()
);

create table sessions (
  id          uuid primary key default gen_random_uuid(),
  device_id   text references devices(id),
  started_at  timestamptz default now(),
  ended_at    timestamptz,
  cost_usd    numeric(6,4)
);
```

**Change from original schema:** Removed `manual_chunks` table entirely. Added `manual_text` column to `devices`.

---

## WebSocket Event Contract

Events emitted from server to app (unchanged from CLAUDE.md):

```ts
onGuideReady(guide: GuideJSON)        // guide synthesized, ready to display
onAudioChunk(audio: Uint8Array)       // streamed TTS audio from Gemini
onToolCall(name: string, args: object) // Gemini wants the app to do something
onSessionEnd()                        // session closed cleanly
onError(message: string)              // recoverable error
```

---

## Tool Declarations

Three tools — the minimum set for a working demo:

| Tool | Args | What it does |
|------|------|-------------|
| `highlightPart` | `{ partId: string }` | Tell AR layer to highlight a physical part |
| `nextStep` | `{ stepIndex: number }` | Advance UI to the next assembly step |
| `markStepComplete` | `{ stepIndex: number }` | Mark a step as finished |

---

## Guide Synthesis

The server takes the full manual text and asks `gemini-3-flash` to produce a structured `GuideJSON`:

- Input: full manual text + the GuideJSON schema as a prompt
- Output: JSON matching the `GuideJSON` interface
- Method: Single `generateContent` call with structured output

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `express` | latest | HTTP server |
| `ws` | latest | WebSocket server (app ↔ relay) |
| `@google/genai` | latest | Gemini Live API + text generation |
| `@supabase/supabase-js` | latest | Supabase client |
| `pdf-parse` | latest | Extract text from PDF files |
| `tsx` | latest | Run TypeScript without build step |

---

## Environment Variables

```
SUPABASE_URL=         # Supabase project URL
SUPABASE_ANON_KEY=    # Supabase anon/public key
GEMINI_API_KEY=       # Google AI Studio API key
SERVER_PORT=3001      # Express server port (default 3001)
```

---

## What's Explicitly Out of Scope

- RAG pipeline (chunking, embeddings, vector search) — manual fits in context
- Authentication / authorization
- Error recovery / WebSocket reconnection
- Auto device detection from camera
- Per-frame cost tracking
- Multi-device catalog management UI
- In-app PDF upload
- Production deployment configuration

---

## Models

| Use | Model | Why |
|-----|-------|-----|
| Guide synthesis | `gemini-3-flash` | Fast, cheap, good at structured output |
| Live voice+vision | `gemini-3.1-flash-live-preview` | WebSocket model with native voice+vision |
| Embedding | Not needed | Full manual fits in context window |

---

## Cost Budget

- Target: < $0.50 per session
- Audio-only: ~$0.23 / 10 min
- Frames add on top — throttled to max 1 frame / 3 seconds (P2 owns throttle)
