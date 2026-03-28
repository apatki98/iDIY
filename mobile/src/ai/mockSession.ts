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
