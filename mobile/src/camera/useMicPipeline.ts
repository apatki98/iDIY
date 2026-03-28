import { useRef, useCallback, useState } from 'react';
import { Audio } from 'expo-av';

type UseMicPipelineOptions = {
  onAudioChunk: (audio: Uint8Array) => void;
  onError: (message: string) => void;
};

export function useMicPipeline({ onAudioChunk, onError }: UseMicPipelineOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        onError('Microphone permission denied');
        return;
      }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;

      recording.setOnRecordingStatusUpdate(async (status) => {
        if (!status.isRecording || !recordingRef.current) return;
        try {
          const uri = recordingRef.current.getURI();
          if (!uri) return;
          const response = await fetch(uri);
          const buffer = await response.arrayBuffer();
          onAudioChunk(new Uint8Array(buffer));
        } catch {
          // non-fatal — skip chunk on read error
        }
      });

      recording.setProgressUpdateInterval(1000);
      setIsRecording(true);
      console.log('[MicPipeline] Recording started');
    } catch (e: any) {
      onError(`Mic error: ${e.message}`);
    }
  }, [onAudioChunk, onError]);

  const stopRecording = useCallback(async () => {
    try {
      await recordingRef.current?.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      recordingRef.current = null;
      setIsRecording(false);
      console.log('[MicPipeline] Recording stopped');
    } catch (e: any) {
      onError(`Mic stop error: ${e.message}`);
    }
  }, [onError]);

  return { isRecording, startRecording, stopRecording };
}
