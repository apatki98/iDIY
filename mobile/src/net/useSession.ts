import { useRef, useState, useCallback } from 'react';
import type { GuideJSON } from '../types/guide';

export type SessionCallbacks = {
  onGuideReady: (guide: GuideJSON) => void;
  onAudioChunk: (audioBase64: string) => void;
  onToolCall: (name: string, args: Record<string, unknown>, callId: string) => void;
  onTranscript: (speaker: 'user' | 'model', text: string) => void;
  onError: (message: string) => void;
  onSessionEnd: () => void;
};

export type UseSessionOptions = {
  serverUrl: string;
  deviceId: string;
} & SessionCallbacks;

export function useSession(options: UseSessionOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const connect = useCallback(() => {
    if (wsRef.current) return;

    const ws = new WebSocket(optionsRef.current.serverUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[useSession] Connected, sending init');
      setIsConnected(true);
      ws.send(JSON.stringify({
        type: 'init',
        deviceId: optionsRef.current.deviceId,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        const cb = optionsRef.current;

        switch (msg.event) {
          case 'onGuideReady':
            cb.onGuideReady(msg.data as GuideJSON);
            break;
          case 'onAudioChunk':
            cb.onAudioChunk(msg.data.audio as string);
            break;
          case 'onToolCall':
            cb.onToolCall(
              msg.data.name as string,
              (msg.data.args ?? {}) as Record<string, unknown>,
              msg.data.callId as string,
            );
            break;
          case 'onTranscript':
            cb.onTranscript(
              msg.data.speaker as 'user' | 'model',
              msg.data.text as string,
            );
            break;
          case 'onError':
            cb.onError(msg.data.message as string);
            break;
          case 'onSessionEnd':
            cb.onSessionEnd();
            break;
          default:
            console.warn('[useSession] Unknown event:', msg.event);
        }
      } catch (e) {
        console.error('[useSession] Parse error:', e);
      }
    };

    ws.onerror = (event) => {
      console.error('[useSession] WebSocket error:', event);
      optionsRef.current.onError('WebSocket connection error');
    };

    ws.onclose = () => {
      console.log('[useSession] Disconnected');
      setIsConnected(false);
      wsRef.current = null;
    };
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
  }, []);

  const sendAudio = useCallback((base64Pcm: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'audio', data: base64Pcm }));
    }
  }, []);

  const sendFrame = useCallback((base64Jpeg: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'frame', data: base64Jpeg }));
    }
  }, []);

  const sendToolResponse = useCallback((callId: string, result: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'toolResponse', callId, result }));
    }
  }, []);

  return {
    connect,
    disconnect,
    sendAudio,
    sendFrame,
    sendToolResponse,
    isConnected,
  };
}
