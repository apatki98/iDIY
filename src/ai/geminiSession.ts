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
