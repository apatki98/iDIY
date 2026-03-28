import { useRef, useCallback, useState } from 'react';

// TODO: install expo-av — `npx expo install expo-av`
// import { Audio } from 'expo-av';

type UseMicPipelineOptions = {
  onAudioChunk: (audio: Uint8Array) => void;
  onError: (message: string) => void;
};

export function useMicPipeline({ onAudioChunk, onError }: UseMicPipelineOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef<any>(null); // will be Audio.Recording once expo-av is installed

  const startRecording = useCallback(async () => {
    try {
      // TODO: wire up expo-av
      // await Audio.requestPermissionsAsync();
      // await Audio.setAudioModeAsync({ allowsRecordingIOS: true });
      // const { recording } = await Audio.Recording.createAsync(
      //   Audio.RecordingOptionsPresets.HIGH_QUALITY
      // );
      // recordingRef.current = recording;

      // recording.setOnRecordingStatusUpdate((status) => {
      //   if (status.metering !== undefined) {
      //     // read raw audio and forward as Uint8Array chunks
      //     // TODO: read recording URI and stream chunks to onAudioChunk
      //   }
      // });

      setIsRecording(true);
      console.log('[MicPipeline] Recording started');
    } catch (e: any) {
      onError(`Mic error: ${e.message}`);
    }
  }, [onError]);

  const stopRecording = useCallback(async () => {
    try {
      // TODO: await recordingRef.current?.stopAndUnloadAsync();
      recordingRef.current = null;
      setIsRecording(false);
      console.log('[MicPipeline] Recording stopped');
    } catch (e: any) {
      onError(`Mic stop error: ${e.message}`);
    }
  }, [onError]);

  return { isRecording, startRecording, stopRecording };
}
