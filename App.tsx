import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { IDIYCameraView } from './src/camera/CameraView';
import { startMockSession } from './src/ai/mockSession';
import { GuideJSON, Step } from './src/types/guide';

export default function App() {
  const [guide, setGuide] = useState<GuideJSON | null>(null);
  const [currentStep, setCurrentStep] = useState<Step | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<{ stop: () => void } | null>(null);
  const guideRef = useRef<GuideJSON | null>(null);
  const stepIndexRef = useRef(0);

  const goToStep = useCallback((index: number) => {
    const g = guideRef.current;
    if (!g) return;
    const clamped = Math.max(0, Math.min(index, g.steps.length - 1));
    stepIndexRef.current = clamped;
    setStepIndex(clamped);
    setCurrentStep(g.steps[clamped]);
  }, []);

  // Called by P1's real session when Gemini requests a tool
  const handleToolCall = useCallback((name: string, _args: object) => {
    switch (name) {
      case 'nextStep':
        goToStep(stepIndexRef.current + 1);
        break;
      case 'prevStep':
        goToStep(stepIndexRef.current - 1);
        break;
      case 'goToStep': {
        const args = _args as { index: number };
        goToStep(args.index);
        break;
      }
      default:
        console.warn('[App] Unknown tool call:', name);
    }
  }, [goToStep]);

  useEffect(() => {
    sessionRef.current = startMockSession({
      onGuideReady: (g) => {
        console.log('[App] Guide ready:', g.deviceName);
        guideRef.current = g;
        setGuide(g);
        goToStep(0);
      },
      onAudioChunk: (audio) => {
        console.log('[App] Audio chunk received, bytes:', audio.byteLength);
      },
      onError: (message) => {
        console.warn('[App] Session error:', message);
        setError(message);
      },
      onSessionEnd: () => {
        console.log('[App] Session ended');
      },
    });

    return () => {
      sessionRef.current?.stop();
    };
  }, [goToStep]);

  const handleFrame = (frame: { base64: string; width: number; height: number; timestamp: number }) => {
    console.log(`[App] Frame sent — ${frame.width}x${frame.height} @ ${frame.timestamp}`);
  };

  const handleAudioChunk = (audio: Uint8Array) => {
    console.log('[App] Mic chunk, bytes:', audio.byteLength);
  };

  const isFirst = stepIndex === 0;
  const isLast = guide ? stepIndex === guide.steps.length - 1 : true;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <IDIYCameraView
        currentStep={currentStep}
        onFrame={handleFrame}
        onAudioChunk={handleAudioChunk}
        onError={setError}
      />

      {/* Step HUD */}
      {guide && currentStep && (
        <View style={styles.hud} pointerEvents="none">
          <Text style={styles.deviceName}>{guide.deviceName}</Text>
          <Text style={styles.stepTitle}>
            Step {currentStep.index + 1} / {guide.steps.length}: {currentStep.title}
          </Text>
          <Text style={styles.stepDesc}>{currentStep.description}</Text>
        </View>
      )}

      {/* Step navigation buttons */}
      {guide && (
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.navBtn, isFirst && styles.navBtnDisabled]}
            onPress={() => goToStep(stepIndex - 1)}
            disabled={isFirst}
          >
            <Text style={styles.navBtnText}>← Prev</Text>
          </TouchableOpacity>

          <Text style={styles.stepCounter}>
            {stepIndex + 1} / {guide.steps.length}
          </Text>

          <TouchableOpacity
            style={[styles.navBtn, isLast && styles.navBtnDisabled]}
            onPress={() => goToStep(stepIndex + 1)}
            disabled={isLast}
          >
            <Text style={styles.navBtnText}>Next →</Text>
          </TouchableOpacity>
        </View>
      )}

      {!guide && (
        <View style={styles.loading} pointerEvents="none">
          <Text style={styles.loadingText}>Loading guide...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorBanner} pointerEvents="none">
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  hud: {
    position: 'absolute',
    bottom: 110,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    padding: 16,
  },
  deviceName: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 4,
  },
  stepTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  stepDesc: {
    color: '#ddd',
    fontSize: 13,
  },
  navRow: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  navBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  stepCounter: {
    color: '#fff',
    fontSize: 14,
  },
  loading: {
    position: 'absolute',
    bottom: 40,
    left: 16,
  },
  loadingText: {
    color: '#fff',
    fontSize: 14,
  },
  errorBanner: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(200,0,0,0.75)',
    borderRadius: 8,
    padding: 10,
  },
  errorText: {
    color: '#fff',
    fontSize: 13,
  },
});
