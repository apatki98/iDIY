# P1 AI Backend — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an Express relay server that connects the React Native app to Gemini Live API, with manual lookup, guide synthesis, voice+vision relay, and tool calling.

**Architecture:** Express + WebSocket server sits between the phone app and Gemini Live. On session start, it fetches the full manual text from Supabase, synthesizes a GuideJSON, then opens a Gemini Live WebSocket to relay audio/frames/tool-calls bidirectionally.

**Tech Stack:** TypeScript, Express, ws, @google/genai, @supabase/supabase-js, pdf-parse, tsx

**Spec:** `docs/superpowers/specs/2026-03-28-p1-ai-backend-design.md`

---

## Task 1: Project Init — package.json + Dependencies + .env

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.env.local`

- [ ] **Step 1: Initialize package.json**

```bash
cd "/Users/pulkitwalia/I diy"
npm init -y
```

- [ ] **Step 2: Install dependencies**

```bash
npm install express ws @google/genai @supabase/supabase-js pdf-parse
npm install -D typescript @types/express @types/ws @types/node tsx
```

- [ ] **Step 3: Create tsconfig.json**

Create `tsconfig.json` at project root:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "dist",
    "rootDir": "src",
    "resolveJsonModule": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 4: Create .env.local with placeholder keys**

Create `.env.local` at project root:

```
SUPABASE_URL=your-supabase-url-here
SUPABASE_ANON_KEY=your-supabase-anon-key-here
GEMINI_API_KEY=your-gemini-api-key-here
SERVER_PORT=3001
```

- [ ] **Step 5: Add dev script to package.json**

Add to `package.json` scripts:

```json
{
  "scripts": {
    "dev": "tsx --env-file=.env.local src/server/index.ts",
    "ingest": "tsx --env-file=.env.local src/ai/ingestManual.ts"
  }
}
```

- [ ] **Step 6: Verify setup**

```bash
npx tsx --version
```

Expected: prints tsx version number.

- [ ] **Step 7: Commit**

```bash
git add package.json tsconfig.json package-lock.json
git commit -m "chore(p1): init project — deps, tsconfig, dev scripts"
```

Note: Do NOT commit `.env.local` — it's in `.gitignore`.

---

## Task 2: Supabase Client + Updated Schema

**Files:**
- Create: `src/ai/supabaseClient.ts`
- Modify: `supabase/schema.sql`

- [ ] **Step 1: Update the schema to match the spec**

Replace `supabase/schema.sql` with:

```sql
-- iDIY Supabase schema (v2 — simplified, no pgvector)
-- Owner: Person 1 (feature/p1-ai-backend)

create table devices (
  id          text primary key,
  name        text not null,
  brand       text,
  manual_url  text,
  manual_text text,
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

- [ ] **Step 2: Apply this schema in Supabase**

Go to your Supabase dashboard → SQL Editor → paste the schema → Run. (This is a manual step.)

- [ ] **Step 3: Create the Supabase client**

Create `src/ai/supabaseClient.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

- [ ] **Step 4: Verify the client connects**

Create a quick test — add to the bottom of `supabaseClient.ts` temporarily:

```typescript
// Temporary test — remove after verifying
if (import.meta.url === `file://${process.argv[1]}`) {
  const { data, error } = await supabase.from('devices').select('*');
  console.log('Connection test:', error ? `ERROR: ${error.message}` : `OK — ${data?.length ?? 0} devices`);
}
```

Run:
```bash
npx tsx --env-file=.env.local src/ai/supabaseClient.ts
```

Expected: `Connection test: OK — 0 devices`

- [ ] **Step 5: Remove the temporary test code, keep only the export**

Final `src/ai/supabaseClient.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

- [ ] **Step 6: Commit**

```bash
git add src/ai/supabaseClient.ts supabase/schema.sql
git commit -m "feat(p1): supabase client + simplified schema (no pgvector)"
```

---

## Task 3: PDF Ingest Script

**Files:**
- Create: `src/ai/ingestManual.ts`

This is a CLI script. You run it once per manual to extract the PDF text and save it to the `devices` table.

- [ ] **Step 1: Create the ingest script**

Create `src/ai/ingestManual.ts`:

```typescript
import { readFileSync } from 'fs';
import { resolve } from 'path';
import pdfParse from 'pdf-parse';
import { supabase } from './supabaseClient.js';

async function ingest() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log('Usage: npm run ingest <pdf-path> <device-id> <device-name> [brand]');
    console.log('Example: npm run ingest ./manuals/malm.pdf IKEA-MALM-AA2301456 "IKEA MALM 6-drawer dresser" IKEA');
    process.exit(1);
  }

  const [pdfPath, deviceId, deviceName, brand] = args;

  // 1. Read and parse PDF
  console.log(`Reading PDF: ${pdfPath}`);
  const pdfBuffer = readFileSync(resolve(pdfPath));
  const pdf = await pdfParse(pdfBuffer);
  const manualText = pdf.text;
  console.log(`Extracted ${manualText.length} characters from ${pdf.numpages} pages`);

  // 2. Upsert device with manual text
  const { error } = await supabase
    .from('devices')
    .upsert({
      id: deviceId,
      name: deviceName,
      brand: brand ?? null,
      manual_text: manualText,
    });

  if (error) {
    console.error('Failed to save:', error.message);
    process.exit(1);
  }

  console.log(`Saved device "${deviceName}" (${deviceId}) with ${manualText.length} chars of manual text`);
}

ingest();
```

- [ ] **Step 2: Test with a real PDF**

Download any small PDF (an IKEA manual, or any test PDF) and place it in the project. Then run:

```bash
npm run ingest ./test-manual.pdf TEST-DEVICE-001 "Test Device" "TestBrand"
```

Expected output:
```
Reading PDF: ./test-manual.pdf
Extracted XXXX characters from N pages
Saved device "Test Device" (TEST-DEVICE-001) with XXXX chars of manual text
```

- [ ] **Step 3: Verify data in Supabase**

Go to Supabase dashboard → Table Editor → `devices` table. You should see the row with `manual_text` populated.

- [ ] **Step 4: Commit**

```bash
git add src/ai/ingestManual.ts
git commit -m "feat(p1): PDF ingest script — extracts text and saves to devices table"
```

---

## Task 4: Tool Declarations

**Files:**
- Create: `src/ai/toolDeclarations.ts`

- [ ] **Step 1: Create the tool declarations file**

Create `src/ai/toolDeclarations.ts`:

```typescript
// Tool schemas that Gemini can call during a live session.
// When Gemini calls one of these, the server relays it to the app as onToolCall.

export const toolDeclarations = [
  {
    name: 'highlightPart',
    description: 'Highlight a specific part in the AR view so the user can identify it physically.',
    parametersJsonSchema: {
      type: 'object' as const,
      properties: {
        partId: {
          type: 'string',
          description: 'The ID of the part to highlight (matches Part.id from the guide)',
        },
      },
      required: ['partId'],
    },
  },
  {
    name: 'nextStep',
    description: 'Advance the assembly UI to the next step.',
    parametersJsonSchema: {
      type: 'object' as const,
      properties: {
        stepIndex: {
          type: 'number',
          description: 'The index of the step to navigate to',
        },
      },
      required: ['stepIndex'],
    },
  },
  {
    name: 'markStepComplete',
    description: 'Mark an assembly step as completed in the UI checklist.',
    parametersJsonSchema: {
      type: 'object' as const,
      properties: {
        stepIndex: {
          type: 'number',
          description: 'The index of the step to mark as complete',
        },
      },
      required: ['stepIndex'],
    },
  },
];
```

- [ ] **Step 2: Commit**

```bash
git add src/ai/toolDeclarations.ts
git commit -m "feat(p1): tool declarations — highlightPart, nextStep, markStepComplete"
```

---

## Task 5: Guide Synthesis

**Files:**
- Create: `src/ai/guideSynthesis.ts`

This calls `gemini-3-flash` with the full manual text and asks it to produce a structured `GuideJSON`.

- [ ] **Step 1: Create the guide synthesis module**

Create `src/ai/guideSynthesis.ts`:

```typescript
import { GoogleGenAI } from '@google/genai';
import type { GuideJSON } from '../types/guide.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const GUIDE_PROMPT = `You are an assembly guide generator. Given the full text of a product assembly manual, produce a structured JSON guide.

The output MUST be valid JSON matching this exact schema:
{
  "deviceId": string,       // use the provided device ID
  "deviceName": string,     // product name from the manual
  "totalMinutes": number,   // estimated total assembly time
  "requiresTwoPeople": boolean,
  "twoPersonSteps": number[], // step indices that need 2 people
  "parts": [{ "id": string, "name": string, "quantity": number }],
  "tools": [{ "id": string, "name": string, "required": boolean }],
  "steps": [{
    "index": number,
    "title": string,
    "description": string,
    "durationMin": number,
    "parts": string[],      // part IDs used in this step
    "arLabel": string       // short label for AR overlay (optional)
  }]
}

Be thorough — include every step from the manual. Use clear, concise language for descriptions.
Output ONLY the JSON, no markdown fences, no commentary.`;

export async function synthesizeGuide(manualText: string, deviceId: string): Promise<GuideJSON> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash',
    contents: [
      {
        role: 'user',
        parts: [
          { text: GUIDE_PROMPT },
          { text: `Device ID: ${deviceId}\n\nManual text:\n${manualText}` },
        ],
      },
    ],
  });

  const text = response.text ?? '';
  // Strip markdown fences if the model wraps them anyway
  const cleaned = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
  const guide: GuideJSON = JSON.parse(cleaned);
  return guide;
}
```

- [ ] **Step 2: Test guide synthesis manually**

Add a temporary test block at the bottom of the file:

```typescript
if (import.meta.url === `file://${process.argv[1]}`) {
  const testManual = `
    IKEA MALM 6-drawer dresser assembly instructions.
    Parts: 2 side panels, 6 drawer fronts, 24 cam lock nuts, 1 back panel.
    Tools needed: Phillips screwdriver #2 (required), rubber mallet (required), level (optional).
    Step 1: Unbox and sort all parts. Match to parts list. (15 min)
    Step 2: Assemble frame using side panels and cam locks. (25 min, 2 people recommended)
    Step 3: Insert drawers and attach fronts. (20 min)
    Step 4: Attach back panel. (10 min)
    Step 5: Secure to wall with included bracket. (10 min, 2 people required)
  `;
  const guide = await synthesizeGuide(testManual, 'IKEA-MALM-TEST');
  console.log(JSON.stringify(guide, null, 2));
}
```

Run:
```bash
npx tsx --env-file=.env.local src/ai/guideSynthesis.ts
```

Expected: A valid JSON object printed to console matching the GuideJSON shape.

- [ ] **Step 3: Remove the temporary test code**

Remove the `if (import.meta.url ...)` block. Keep only the import, const, and export.

- [ ] **Step 4: Commit**

```bash
git add src/ai/guideSynthesis.ts
git commit -m "feat(p1): guide synthesis — manual text to GuideJSON via gemini-3-flash"
```

---

## Task 6: Session Logger

**Files:**
- Create: `src/ai/sessionLogger.ts`

- [ ] **Step 1: Create the session logger**

Create `src/ai/sessionLogger.ts`:

```typescript
import { supabase } from './supabaseClient.js';

export async function logSessionStart(deviceId: string): Promise<string> {
  const { data, error } = await supabase
    .from('sessions')
    .insert({ device_id: deviceId })
    .select('id')
    .single();

  if (error) {
    console.error('[SessionLogger] Failed to log start:', error.message);
    throw error;
  }

  console.log(`[SessionLogger] Session started: ${data.id}`);
  return data.id;
}

export async function logSessionEnd(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', sessionId);

  if (error) {
    console.error('[SessionLogger] Failed to log end:', error.message);
  } else {
    console.log(`[SessionLogger] Session ended: ${sessionId}`);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ai/sessionLogger.ts
git commit -m "feat(p1): session logger — start/end tracking in supabase"
```

---

## Task 7: Gemini Live Session Manager

**Files:**
- Create: `src/ai/geminiSession.ts`

This is the core module — it opens a WebSocket to Gemini Live and relays events.

- [ ] **Step 1: Create the Gemini session manager**

Create `src/ai/geminiSession.ts`:

```typescript
import { GoogleGenAI, Modality } from '@google/genai';
import { toolDeclarations } from './toolDeclarations.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export type GeminiCallbacks = {
  onAudioChunk: (audioBase64: string) => void;
  onToolCall: (name: string, args: Record<string, unknown>, callId: string) => void;
  onTranscript: (speaker: 'user' | 'model', text: string) => void;
  onClose: () => void;
  onError: (message: string) => void;
};

export async function startGeminiSession(
  manualText: string,
  deviceName: string,
  callbacks: GeminiCallbacks,
) {
  const systemInstruction = `You are an AR assembly assistant for the "${deviceName}".
You are helping a user assemble this product step by step using voice and vision.
You can see what the user's camera sees and hear what they say.

Here is the full assembly manual for reference:
---
${manualText}
---

Instructions:
- Guide the user through each step conversationally.
- When referencing a physical part, call the highlightPart tool so the AR view highlights it.
- When the user completes a step, call markStepComplete, then call nextStep to advance.
- Be concise and encouraging. Speak naturally.`;

  const session = await ai.live.connect({
    model: 'gemini-3.1-flash-live-preview',
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      tools: [{ functionDeclarations: toolDeclarations }],
    },
    callbacks: {
      onopen: () => {
        console.log('[GeminiSession] Connected');
      },
      onmessage: (message: any) => {
        const content = message.serverContent;

        // Handle audio response
        if (content?.modelTurn?.parts) {
          for (const part of content.modelTurn.parts) {
            if (part.inlineData?.data) {
              callbacks.onAudioChunk(part.inlineData.data);
            }
          }
        }

        // Handle transcripts
        if (content?.inputTranscription?.text) {
          callbacks.onTranscript('user', content.inputTranscription.text);
        }
        if (content?.outputTranscription?.text) {
          callbacks.onTranscript('model', content.outputTranscription.text);
        }

        // Handle tool calls
        const toolCall = message.toolCall;
        if (toolCall?.functionCalls) {
          for (const fc of toolCall.functionCalls) {
            callbacks.onToolCall(fc.name, fc.args ?? {}, fc.id);
          }
        }
      },
      onerror: (error: any) => {
        console.error('[GeminiSession] Error:', error.message);
        callbacks.onError(error.message);
      },
      onclose: () => {
        console.log('[GeminiSession] Closed');
        callbacks.onClose();
      },
    },
  });

  return {
    sendAudio: (audioBase64: string) => {
      session.sendRealtimeInput({
        audio: { data: audioBase64, mimeType: 'audio/pcm;rate=16000' },
      });
    },
    sendFrame: (frameBase64: string) => {
      session.sendRealtimeInput({
        video: { data: frameBase64, mimeType: 'image/jpeg' },
      });
    },
    sendToolResponse: (callId: string, result: Record<string, unknown>) => {
      session.sendToolResponse({
        functionResponses: [{ id: callId, name: '', response: result }],
      });
    },
    close: () => {
      session.close();
    },
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ai/geminiSession.ts
git commit -m "feat(p1): gemini live session manager — voice/vision relay + tool calls"
```

---

## Task 8: Session Handler (Orchestrator)

**Files:**
- Create: `src/server/sessionHandler.ts`

This wires everything together: when a client connects, it fetches the manual, synthesizes the guide, opens Gemini, and relays events.

- [ ] **Step 1: Create the session handler**

Create `src/server/sessionHandler.ts`:

```typescript
import type { WebSocket } from 'ws';
import { supabase } from '../ai/supabaseClient.js';
import { synthesizeGuide } from '../ai/guideSynthesis.js';
import { startGeminiSession } from '../ai/geminiSession.js';
import { logSessionStart, logSessionEnd } from '../ai/sessionLogger.js';

// Send a typed event to the client app
function emit(ws: WebSocket, event: string, data?: unknown) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({ event, data }));
  }
}

export async function handleSession(ws: WebSocket, deviceId: string) {
  console.log(`[SessionHandler] Starting session for device: ${deviceId}`);

  // 1. Fetch device + manual text from Supabase
  const { data: device, error } = await supabase
    .from('devices')
    .select('*')
    .eq('id', deviceId)
    .single();

  if (error || !device) {
    emit(ws, 'onError', { message: `Device not found: ${deviceId}` });
    ws.close();
    return;
  }

  if (!device.manual_text) {
    emit(ws, 'onError', { message: `No manual text for device: ${deviceId}` });
    ws.close();
    return;
  }

  // 2. Synthesize GuideJSON
  console.log('[SessionHandler] Synthesizing guide...');
  const guide = await synthesizeGuide(device.manual_text, deviceId);
  emit(ws, 'onGuideReady', guide);
  console.log(`[SessionHandler] Guide ready: ${guide.steps.length} steps`);

  // 3. Log session start
  const sessionId = await logSessionStart(deviceId);

  // 4. Open Gemini Live session
  const gemini = await startGeminiSession(
    device.manual_text,
    device.name,
    {
      onAudioChunk: (audioBase64) => {
        emit(ws, 'onAudioChunk', { audio: audioBase64 });
      },
      onToolCall: (name, args, callId) => {
        emit(ws, 'onToolCall', { name, args, callId });
      },
      onTranscript: (speaker, text) => {
        emit(ws, 'onTranscript', { speaker, text });
      },
      onClose: async () => {
        await logSessionEnd(sessionId);
        emit(ws, 'onSessionEnd');
        ws.close();
      },
      onError: (message) => {
        emit(ws, 'onError', { message });
      },
    },
  );

  // 5. Relay incoming messages from the app to Gemini
  ws.on('message', (raw) => {
    const msg = JSON.parse(raw.toString());

    switch (msg.type) {
      case 'audio':
        gemini.sendAudio(msg.data);
        break;
      case 'frame':
        gemini.sendFrame(msg.data);
        break;
      case 'toolResponse':
        gemini.sendToolResponse(msg.callId, msg.result);
        break;
    }
  });

  // 6. Clean up on disconnect
  ws.on('close', async () => {
    console.log('[SessionHandler] Client disconnected');
    gemini.close();
    await logSessionEnd(sessionId);
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/server/sessionHandler.ts
git commit -m "feat(p1): session handler — orchestrates manual lookup, guide synthesis, gemini relay"
```

---

## Task 9: Express + WebSocket Server

**Files:**
- Create: `src/server/index.ts`

- [ ] **Step 1: Create the server entry point**

Create `src/server/index.ts`:

```typescript
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { handleSession } from './sessionHandler.js';

const app = express();
const port = Number(process.env.SERVER_PORT) || 3001;

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const server = createServer(app);

// WebSocket server on the same port
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket) => {
  console.log('[Server] New client connected');

  // Client must send an init message with deviceId
  ws.once('message', (raw) => {
    const msg = JSON.parse(raw.toString());

    if (msg.type === 'init' && msg.deviceId) {
      handleSession(ws, msg.deviceId);
    } else {
      ws.send(JSON.stringify({ event: 'onError', data: { message: 'First message must be { type: "init", deviceId: "..." }' } }));
      ws.close();
    }
  });
});

server.listen(port, () => {
  console.log(`[iDIY Server] Running on http://localhost:${port}`);
  console.log(`[iDIY Server] WebSocket ready on ws://localhost:${port}`);
});
```

- [ ] **Step 2: Start the server**

```bash
npm run dev
```

Expected:
```
[iDIY Server] Running on http://localhost:3001
[iDIY Server] WebSocket ready on ws://localhost:3001
```

- [ ] **Step 3: Test health endpoint**

```bash
curl http://localhost:3001/health
```

Expected: `{"status":"ok"}`

- [ ] **Step 4: Commit**

```bash
git add src/server/index.ts
git commit -m "feat(p1): express + websocket server entry point"
```

---

## Task 10: End-to-End Smoke Test

No new files — this tests the full happy path.

- [ ] **Step 1: Make sure you have a device ingested**

If you haven't already:
```bash
npm run ingest ./path-to-manual.pdf IKEA-MALM-AA2301456 "IKEA MALM 6-drawer dresser" IKEA
```

- [ ] **Step 2: Start the server**

```bash
npm run dev
```

- [ ] **Step 3: Test with a WebSocket client**

Create a quick test script `src/test-client.ts`:

```typescript
import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:3001');

ws.on('open', () => {
  console.log('Connected — sending init');
  ws.send(JSON.stringify({ type: 'init', deviceId: 'IKEA-MALM-AA2301456' }));
});

ws.on('message', (raw) => {
  const msg = JSON.parse(raw.toString());
  console.log(`Event: ${msg.event}`, msg.data ? JSON.stringify(msg.data).slice(0, 200) : '');

  // If we get onGuideReady, the core flow works
  if (msg.event === 'onGuideReady') {
    console.log('\n=== GUIDE RECEIVED ===');
    console.log(`Steps: ${msg.data.steps?.length}`);
    console.log(`Parts: ${msg.data.parts?.length}`);
    console.log(`Tools: ${msg.data.tools?.length}`);
    console.log('=== SMOKE TEST PASSED ===\n');
  }
});

ws.on('close', () => console.log('Disconnected'));
ws.on('error', (err) => console.error('Error:', err.message));
```

Run in a separate terminal:
```bash
npx tsx src/test-client.ts
```

Expected: You see `Event: onGuideReady` followed by `=== SMOKE TEST PASSED ===`.

- [ ] **Step 4: Clean up test client (optional — keep it for P2/P3 reference)**

- [ ] **Step 5: Commit**

```bash
git add src/test-client.ts
git commit -m "feat(p1): smoke test client — verifies end-to-end session flow"
```

---

## Wire Protocol Reference (for P2 + P3)

### Client → Server Messages

```typescript
// First message (required)
{ type: 'init', deviceId: string }

// During session
{ type: 'audio', data: string }       // base64 PCM 16kHz mono
{ type: 'frame', data: string }       // base64 JPEG
{ type: 'toolResponse', callId: string, result: object }
```

### Server → Client Events

```typescript
{ event: 'onGuideReady', data: GuideJSON }
{ event: 'onAudioChunk', data: { audio: string } }  // base64
{ event: 'onToolCall', data: { name: string, args: object, callId: string } }
{ event: 'onTranscript', data: { speaker: 'user' | 'model', text: string } }
{ event: 'onSessionEnd' }
{ event: 'onError', data: { message: string } }
```
