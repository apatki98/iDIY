import { useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

// Gemini sends PCM 16-bit, 16kHz, mono as base64
const SAMPLE_RATE = 16000;
const NUM_CHANNELS = 1;
const BITS_PER_SAMPLE = 16;

// Buffer this many chunks before playing (reduces choppiness)
const MIN_CHUNKS_BEFORE_PLAY = 2;

/**
 * Creates a WAV header for raw PCM data.
 * WAV = 44-byte header + raw PCM bytes.
 */
function createWavHeader(pcmByteLength: number): Uint8Array {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  const byteRate = SAMPLE_RATE * NUM_CHANNELS * (BITS_PER_SAMPLE / 8);
  const blockAlign = NUM_CHANNELS * (BITS_PER_SAMPLE / 8);

  // "RIFF" chunk
  view.setUint32(0, 0x52494646, false);  // "RIFF"
  view.setUint32(4, 36 + pcmByteLength, true); // file size - 8
  view.setUint32(8, 0x57415645, false);  // "WAVE"

  // "fmt " sub-chunk
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true);          // sub-chunk size
  view.setUint16(20, 1, true);           // PCM format
  view.setUint16(22, NUM_CHANNELS, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, BITS_PER_SAMPLE, true);

  // "data" sub-chunk
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, pcmByteLength, true);

  return new Uint8Array(header);
}

/**
 * Converts a Uint8Array to a base64 string.
 * Uses a chunk-based approach to avoid call stack overflow on large arrays.
 */
function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
  }
  return btoa(binary);
}

/**
 * Decodes a base64 string to a Uint8Array.
 */
function base64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function useAudioPlayer() {
  const bufferRef = useRef<Uint8Array[]>([]);
  const chunkCountRef = useRef(0);
  const isPlayingRef = useRef(false);
  const fileCounterRef = useRef(0);

  const playBuffer = useCallback(async () => {
    if (isPlayingRef.current || bufferRef.current.length === 0) return;
    isPlayingRef.current = true;

    // Grab all buffered chunks
    const chunks = bufferRef.current;
    bufferRef.current = [];
    chunkCountRef.current = 0;

    // Concatenate all PCM chunks
    const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
    const pcmData = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      pcmData.set(chunk, offset);
      offset += chunk.length;
    }

    // Create WAV file (header + PCM data)
    const wavHeader = createWavHeader(pcmData.length);
    const wavFile = new Uint8Array(wavHeader.length + pcmData.length);
    wavFile.set(wavHeader, 0);
    wavFile.set(pcmData, wavHeader.length);

    // Write to temp file
    const fileName = `gemini_audio_${fileCounterRef.current++}.wav`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;
    const wavBase64 = uint8ToBase64(wavFile);

    try {
      await FileSystem.writeAsStringAsync(filePath, wavBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Play the file
      const { sound } = await Audio.Sound.createAsync({ uri: filePath });
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
          FileSystem.deleteAsync(filePath, { idempotent: true });
          isPlayingRef.current = false;
          // Play next buffer if more audio arrived while playing
          playBuffer();
        }
      });
      await sound.playAsync();
    } catch (e) {
      console.error('[AudioPlayer] Playback error:', e);
      isPlayingRef.current = false;
      // Try next buffer anyway
      playBuffer();
    }
  }, []);

  const enqueueChunk = useCallback((audioBase64: string) => {
    const pcmBytes = base64ToUint8(audioBase64);
    bufferRef.current.push(pcmBytes);
    chunkCountRef.current++;

    // Play once we have enough chunks buffered
    if (chunkCountRef.current >= MIN_CHUNKS_BEFORE_PLAY && !isPlayingRef.current) {
      playBuffer();
    }
  }, [playBuffer]);

  // Flush any remaining buffered audio (call on session end)
  const flush = useCallback(() => {
    if (bufferRef.current.length > 0 && !isPlayingRef.current) {
      playBuffer();
    }
  }, [playBuffer]);

  return { enqueueChunk, flush };
}
