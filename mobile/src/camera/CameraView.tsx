import React, { useRef, useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { CameraView as ExpoCameraView, CameraType, useCameraPermissions } from 'expo-camera';

import { useFrameStreamer } from './useFrameStreamer';
import { useMicPipeline } from './useMicPipeline';
import { AROverlay } from '../ar/AROverlay';
import { Step } from '../types/guide';

type CameraViewProps = {
  currentStep: Step | null;
  onFrame: (frame: { base64: string; width: number; height: number; timestamp: number }) => void;
  onAudioChunk: (base64Pcm: string) => void;
  onError: (message: string) => void;
};

export function IDIYCameraView({ currentStep, onFrame, onAudioChunk, onError }: CameraViewProps) {
  const cameraRef = useRef<ExpoCameraView>(null);
  const captureIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const { submitFrame } = useFrameStreamer({ onFrame });
  const { startRecording, stopRecording } = useMicPipeline({ onAudioChunk, onError });

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const captureFrame = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.4,
        shutterSound: false,
      });
      if (!photo?.base64) return;
      submitFrame({
        base64: photo.base64,
        width: photo.width,
        height: photo.height,
        timestamp: Date.now(),
      });
    } catch (e: any) {
      onError(`Frame capture error: ${e.message}`);
    }
  }, [submitFrame, onError]);

  const handleCameraReady = useCallback(async () => {
    await startRecording();
    console.log('[CameraView] Camera ready, mic started');

    // Poll for frames — useFrameStreamer handles the 3s throttle internally
    captureIntervalRef.current = setInterval(captureFrame, 3000);
  }, [startRecording, captureFrame]);

  useEffect(() => {
    return () => {
      if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
      stopRecording();
    };
  }, [stopRecording]);

  if (!permission?.granted) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <ExpoCameraView
        ref={cameraRef}
        style={styles.camera}
        facing={'back' as CameraType}
        onCameraReady={handleCameraReady}
      />
      <AROverlay currentStep={currentStep} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
});
