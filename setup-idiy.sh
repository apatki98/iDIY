#!/bin/bash
set -e

cd /c/Users/adi88/iDIY

echo ""
echo "Setting up iDIY..."
echo ""

# ── 1. Project structure ──────────────────────
mkdir -p \
  src/ai \
  src/camera \
  src/ar \
  src/screens \
  src/components \
  src/hooks \
  src/types \
  supabase

# ── 2. CLAUDE.md ──────────────────────────────
cat > CLAUDE.md << 'EOF'
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
EOF

# ── 3. Shared types ───────────────────────────
cat > src/types/guide.ts << 'EOF'
export interface Part {
  id: string;
  name: string;
  quantity: number;
  imageUrl?: string;
}

export interface Tool {
  id: string;
  name: string;
  required: boolean;
}

export interface Step {
  index: number;
  title: string;
  description: string;
  durationMin: number;
  parts: string[];
  arLabel?: string;
}

export interface GuideJSON {
  deviceId: string;
  deviceName: string;
  totalMinutes: number;
  requiresTwoPeople: boolean;
  twoPersonSteps: number[];
  parts: Part[];
  tools: Tool[];
  steps: Step[];
}
EOF

# ── 4. Mock guide ─────────────────────────────
cat > src/types/guide.mock.ts << 'EOF'
import { GuideJSON } from './guide';

export const MOCK_GUIDE: GuideJSON = {
  deviceId: 'IKEA-MALM-AA2301456',
  deviceName: 'IKEA MALM 6-drawer dresser',
  totalMinutes: 90,
  requiresTwoPeople: true,
  twoPersonSteps: [3, 6],
  parts: [
    { id: 'side-panel', name: 'Side panel A', quantity: 2 },
    { id: 'drawer-front', name: 'Drawer front', quantity: 6 },
    { id: 'cam-lock', name: 'Cam lock nut', quantity: 24 },
  ],
  tools: [
    { id: 'screwdriver', name: 'Phillips screwdriver #2', required: true },
    { id: 'mallet', name: 'Rubber mallet', required: true },
    { id: 'level', name: 'Level', required: false },
  ],
  steps: [
    {
      index: 0,
      title: 'Unbox and sort parts',
      description: 'Lay all parts on the floor and match them to the parts list.',
      durationMin: 15,
      parts: ['side-panel', 'drawer-front', 'cam-lock'],
    },
    {
      index: 1,
      title: 'Assemble the frame',
      description: 'Connect the side panels using cam lock nuts.',
      durationMin: 25,
      parts: ['side-panel', 'cam-lock'],
      arLabel: 'Side panel A',
    },
    {
      index: 2,
      title: 'Attach drawer fronts',
      description: 'Slide each drawer into its rail and click the front into place.',
      durationMin: 20,
      parts: ['drawer-front'],
      arLabel: 'Drawer front',
    },
  ],
};
EOF

# ── 5. Mock Gemini session ────────────────────
cat > src/ai/mockSession.ts << 'EOF'
import { MOCK_GUIDE } from '../types/guide.mock';

type SessionCallbacks = {
  onGuideReady: (guide: typeof MOCK_GUIDE) => void;
  onAudioChunk: (audio: Uint8Array) => void;
  onError: (message: string) => void;
  onSessionEnd: () => void;
};

export function startMockSession(callbacks: SessionCallbacks) {
  console.log('[MockSession] Starting mock Gemini session...');

  const guideTimer = setTimeout(() => {
    console.log('[MockSession] Emitting onGuideReady');
    callbacks.onGuideReady(MOCK_GUIDE);
  }, 2000);

  const audioTimer = setInterval(() => {
    const fakeAudio = new Uint8Array(256);
    callbacks.onAudioChunk(fakeAudio);
  }, 3000);

  return {
    stop: () => {
      clearTimeout(guideTimer);
      clearInterval(audioTimer);
      callbacks.onSessionEnd();
      console.log('[MockSession] Session ended');
    },
  };
}
EOF

# ── 6. Supabase schema ────────────────────────
cat > supabase/schema.sql << 'EOF'
-- iDIY Supabase schema
-- Owner: Person 1 (feature/p1-ai-backend)

create extension if not exists vector;

create table manual_chunks (
  id          uuid primary key default gen_random_uuid(),
  device_id   text not null,
  chunk_text  text not null,
  embedding   vector(1024),
  page        int,
  created_at  timestamptz default now()
);

create index on manual_chunks using ivfflat (embedding vector_cosine_ops);

create table devices (
  id          text primary key,
  name        text not null,
  brand       text,
  manual_url  text,
  created_at  timestamptz default now()
);

create table sessions (
  id          uuid primary key default gen_random_uuid(),
  device_id   text references devices(id),
  started_at  timestamptz default now(),
  ended_at    timestamptz,
  cost_usd    numeric(6,4)
);
EOF

# ── 7. .gitignore ─────────────────────────────
cat > .gitignore << 'EOF'
node_modules/
.env.local
.env
*.log
.expo/
dist/
ios/
android/
EOF

# ── 8. README ─────────────────────────────────
cat > README.md << 'EOF'
# iDIY

AI-powered AR assembly guide. Point your camera at any flat-pack furniture — iDIY walks you through assembly step by step using voice, vision, and AR overlays.

## Branches
| Branch | Owner | Scope |
|--------|-------|-------|
| `feature/p1-ai-backend` | Person 1 | Gemini Live, RAG, Supabase |
| `feature/p2-camera-ar`  | Person 2 | Camera, mic, ViroReact AR |
| `feature/p3-ui-product` | Person 3 | All screens, step cards, nav |

## Getting started
See `CLAUDE.md` for the full shared contract (types, events, mock helpers).

## Stack
React Native · Expo · Gemini Live API · ViroReact · Supabase (pgvector)
EOF

# ── 9. Initial commit on main ─────────────────
git add .
git commit -m "chore: init iDIY repo — shared types, CLAUDE.md, mock session, schema"

echo ""
echo "✓ main branch ready"
echo ""

# ── 10. Create 3 feature branches ────────────
git checkout -b feature/p1-ai-backend
cat > src/ai/.gitkeep << 'EOF'
# Person 1 owns this folder
# Gemini Live session, RAG pipeline, tool declarations
EOF
git add . && git commit -m "chore(p1): scaffold ai/backend branch"

git checkout main
git checkout -b feature/p2-camera-ar
cat > src/camera/.gitkeep << 'EOF'
# Person 2 owns this folder
# Expo Camera, mic pipeline, frame streaming
EOF
cat > src/ar/.gitkeep << 'EOF'
# Person 2 owns this folder
# ViroReact AR overlay, bounding boxes, part detection
EOF
git add . && git commit -m "chore(p2): scaffold camera/ar branch"

git checkout main
git checkout -b feature/p3-ui-product
cat > src/screens/.gitkeep << 'EOF'
# Person 3 owns this folder
# Checklist screen, readiness gate, step cards, nav flow
EOF
cat > src/components/.gitkeep << 'EOF'
# Person 3 owns this folder
# Shared UI components
EOF
git add . && git commit -m "chore(p3): scaffold ui/product branch"

git checkout main

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  iDIY repo ready"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
git branch
echo ""
echo "Next: push all branches to GitHub:"
echo "  git push origin main feature/p1-ai-backend feature/p2-camera-ar feature/p3-ui-product"
echo ""
