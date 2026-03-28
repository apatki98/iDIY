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
