import React, { useRef, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

// TODO: install expo-camera — `npx expo install expo-camera`
// import { Camera, CameraType } from 'expo-camera';

import { useFrameStreamer } from './useFrameStreamer';
import { useMicPipeline } from './useMicPipeline';
import { AROverlay } from '../ar/AROverlay';
import { Step } from '../types/guide';

type CameraViewProps = {
  currentStep: Step | null;
  onFrame: (frame: { base64: string; width: number; height: number; timestamp: number }) => void;
  onAudioChunk: (audio: Uint8Array) => void;
  onError: (message: string) => void;
};

export function IDIYCameraView({ currentStep, onFrame, onAudioChunk, onError }: CameraViewProps) {
  const cameraRef = useRef<any>(null); // will be Camera ref once expo-camera is installed

  const { submitFrame } = useFrameStreamer({ onFrame });
  const { startRecording, stopRecording } = useMicPipeline({ onAudioChunk, onError });

  // Called by expo-camera on each available frame
  const handleCameraReady = useCallback(async () => {
    await startRecording();
    console.log('[CameraView] Camera ready, mic started');
  }, [startRecording]);

  // TODO: wire up to Camera onCameraReady + interval polling for frames
  // const captureFrame = useCallback(async () => {
  //   if (!cameraRef.current) return;
  //   const photo = await cameraRef.current.takePictureAsync({
  //     base64: true,
  //     quality: 0.4,   // keep payload small
  //     skipProcessing: true,
  //   });
  //   submitFrame({
  //     base64: photo.base64!,
  //     width: photo.width,
  //     height: photo.height,
  //     timestamp: Date.now(),
  //   });
  // }, [submitFrame]);

  return (
    <View style={styles.container}>
      {/* TODO: replace View with Camera once expo-camera is installed
        <Camera
          ref={cameraRef}
          style={styles.camera}
          type={CameraType.back}
          onCameraReady={handleCameraReady}
        />
      */}
      <View style={styles.camera} />

      {/* AR overlay sits on top of the camera feed */}
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
