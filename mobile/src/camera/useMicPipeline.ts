import { useRef, useCallback, useState } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

type UseMicPipelineOptions = {
  onAudioChunk: (base64Pcm: string) => void;
  onError: (message: string) => void;
};

// PCM 16-bit, 16kHz, mono — matches what Gemini Live expects
const PCM_RECORDING_OPTIONS: Audio.RecordingOptions = {
  isMeteringEnabled: false,
  android: {
    extension: '.wav',
    outputFormat: Audio.AndroidOutputFormat.DEFAULT,
    audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 256000,
  },
  ios: {
    extension: '.wav',
    outputFormat: Audio.IOSOutputFormat.LINEARPCM,
    audioQuality: Audio.IOSAudioQuality.LOW,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 256000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {},
};

// WAV header is 44 bytes — skip it to get raw PCM data
const WAV_HEADER_SIZE = 44;

// How often to read the recording file and send a chunk
const POLL_INTERVAL_MS = 1000;

export function useMicPipeline({ onAudioChunk, onError }: UseMicPipelineOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastReadPositionRef = useRef<number>(WAV_HEADER_SIZE);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    lastReadPositionRef.current = WAV_HEADER_SIZE;

    pollTimerRef.current = setInterval(async () => {
      const recording = recordingRef.current;
      if (!recording) return;

      try {
        const uri = recording.getURI();
        if (!uri) return;

        // Read the file info to know its current size
        const info = await FileSystem.getInfoAsync(uri);
        if (!info.exists || !info.size) return;

        const currentSize = info.size;
        const lastPos = lastReadPositionRef.current;

        // Only read if there's new data beyond what we already sent
        if (currentSize <= lastPos) return;

        // Read the new bytes as base64
        const base64Chunk = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
          position: lastPos,
          length: currentSize - lastPos,
        });

        lastReadPositionRef.current = currentSize;

        if (base64Chunk && base64Chunk.length > 0) {
          onAudioChunk(base64Chunk);
        }
      } catch {
        // Non-fatal — skip this chunk on read error
      }
    }, POLL_INTERVAL_MS);
  }, [onAudioChunk, stopPolling]);

  const startRecording = useCallback(async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        onError('Microphone permission denied');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(PCM_RECORDING_OPTIONS);
      recordingRef.current = recording;
      setIsRecording(true);
      startPolling();
      console.log('[MicPipeline] Recording started (PCM 16kHz mono)');
    } catch (e: any) {
      onError(`Mic error: ${e.message}`);
    }
  }, [onError, startPolling]);

  const stopRecording = useCallback(async () => {
    try {
      stopPolling();
      await recordingRef.current?.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      recordingRef.current = null;
      setIsRecording(false);
      lastReadPositionRef.current = WAV_HEADER_SIZE;
      console.log('[MicPipeline] Recording stopped');
    } catch (e: any) {
      onError(`Mic stop error: ${e.message}`);
    }
  }, [onError, stopPolling]);

  return { isRecording, startRecording, stopRecording };
}
