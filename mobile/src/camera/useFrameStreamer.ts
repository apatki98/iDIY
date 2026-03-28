import { useRef, useCallback } from 'react';

const FRAME_INTERVAL_MS = 3000; // max 1 frame every 3 seconds — billed per frame

type FramePayload = {
  base64: string;
  width: number;
  height: number;
  timestamp: number;
};

type UseFrameStreamerOptions = {
  onFrame: (frame: FramePayload) => void;
};

export function useFrameStreamer({ onFrame }: UseFrameStreamerOptions) {
  const lastFrameTime = useRef<number>(0);
  const lastFrameData = useRef<string | null>(null);

  const submitFrame = useCallback(
    (frame: FramePayload) => {
      const now = Date.now();

      // Throttle: reject if less than 3s since last frame
      if (now - lastFrameTime.current < FRAME_INTERVAL_MS) return;

      // Movement check: reject if frame is identical to last (no meaningful change)
      if (frame.base64 === lastFrameData.current) return;

      lastFrameTime.current = now;
      lastFrameData.current = frame.base64;

      onFrame(frame);
    },
    [onFrame]
  );

  return { submitFrame };
}
