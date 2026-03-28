# iDIY — shared Claude Code context

## Project overview
AI-powered AR assembly guide app (React Native + Expo).
Gemini Live handles voice + vision natively — no separate STT/TTS pipeline.

---

## Team branches
| Person | Branch | Owns |
|--------|--------|------|
| Person 1 | feature/p1-ai-backend | Gemini session, RAG, Supabase, tool declarations |
| Person 2 | feature/p2-camera-ar  | Expo Camera, mic pipeline, ViroReact AR overlay |
| Person 3 | feature/p3-ui-product | All screens, step cards, nav flow, checklist |

---

## WebSocket event contract (Person 1 publishes, P2 + P3 consume)

```ts
// Events Person 1 emits from the Gemini session layer
onGuideReady(guide: GuideJSON)       // RAG pipeline complete, guide is ready
onAudioChunk(audio: Uint8Array)      // streamed TTS audio from Gemini
onToolCall(name: string, args: object) // Gemini requested a tool
onSessionEnd()                       // WebSocket closed cleanly
onError(message: string)             // recoverable error
```

---

## Guide JSON shape (canonical — do not change without team agreement)

```ts
interface GuideJSON {
  deviceId:     string          // e.g. "IKEA-MALM-AA2301456"
  deviceName:   string          // e.g. "IKEA MALM 6-drawer dresser"
  totalMinutes: number          // e.g. 90
  requiresTwoPeople: boolean
  twoPersonSteps: number[]      // step indices that need 2 people
  parts: Part[]
  tools: Tool[]
  steps: Step[]
}

interface Part {
  id:       string
  name:     string
  quantity: number
  imageUrl?: string
}

interface Tool {
  id:       string
  name:     string
  required: boolean             // false = recommended only
}

interface Step {
  index:       number
  title:       string
  description: string
  durationMin: number
  parts:       string[]         // Part IDs used in this step
  arLabel?:    string           // short label for AR bounding box overlay
}
```

---

## Frame streaming rule
**Max 1 frame every 3 seconds.** Only send on meaningful camera movement.
Billed per frame — keep this tight. Person 2 owns the throttle logic.

## Session cost reference
~$0.23 / 10 min audio-only. Frames add on top. Budget: <$0.50 / session.

---

## Supabase tables (Person 1 owns schema)
- `manual_chunks` — vectorised PDF chunks for RAG (pgvector, 1024-dim)
- `devices` — known device catalogue
- `sessions` — user session logs

## Env vars (never commit — use .env.local)
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
GEMINI_API_KEY=
```

---

## Mock helpers (for P2 + P3 to develop without the live backend)
- `src/ai/mockSession.ts` — emits fake onGuideReady + onAudioChunk on a timer
- `src/types/guide.mock.ts` — static GuideJSON for an IKEA MALM dresser

---

## Stack
- React Native + Expo (managed workflow)
- @google/genai — Gemini Live WebSocket
- @reactvision/react-viro v2.53.1 — AR
- Supabase — Postgres + pgvector + auth
- Model: gemini-3.1-flash-live-preview (voice+vision), gemini-3-flash (guide synthesis)
- Embedding: text-embedding-004 successor

---

## Expo workflow note (important for Person 2)
Camera and mic work in **Expo managed workflow** — no native code needed.

ViroReact AR (`@reactvision/react-viro`) requires **bare workflow** because it
uses native ARKit (iOS) and ARCore (Android) modules that managed Expo cannot
include automatically.

**Action required before wiring up AR:**
```bash
npx expo eject   # converts project to bare workflow — do this once, team-wide decision
```
Do not eject unilaterally — agree with the team first. Until then, AR components
are stubbed and safe to develop against.
