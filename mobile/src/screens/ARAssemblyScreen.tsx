import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '../theme';
import { GuideJSON, Step } from '../types/guide';
import { IDIYCameraView } from '../camera/CameraView';
import { useSession } from '../net/useSession';
import { useAudioPlayer } from '../audio/useAudioPlayer';
import { SERVER_URL, DEVICE_ID } from '../net/config';

interface ARAssemblyScreenProps {
  guide: GuideJSON;
  onFinish?: () => void;
}

export function ARAssemblyScreen({ guide: guideProp, onFinish }: ARAssemblyScreenProps) {
  // The real guide from the server overrides the prop (which may be a mock)
  const [liveGuide, setLiveGuide] = useState<GuideJSON | null>(null);
  const guide = liveGuide ?? guideProp;

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const guideRef = useRef<GuideJSON>(guide);
  const stepIndexRef = useRef(0);

  // Keep refs in sync with state
  guideRef.current = guide;

  const step: Step | undefined = guide.steps[currentStepIndex];
  const progress = guide.steps.length > 0 ? (currentStepIndex + 1) / guide.steps.length : 0;

  // ── Audio player ──────────────────────────────────────────
  const { enqueueChunk, flush } = useAudioPlayer();

  // ── Step navigation helper ────────────────────────────────
  const goToStep = useCallback((index: number) => {
    const g = guideRef.current;
    if (!g || g.steps.length === 0) return;
    const clamped = Math.max(0, Math.min(index, g.steps.length - 1));
    stepIndexRef.current = clamped;
    setCurrentStepIndex(clamped);
  }, []);

  // ── WebSocket session ─────────────────────────────────────
  const session = useSession({
    serverUrl: SERVER_URL,
    deviceId: DEVICE_ID,

    onGuideReady: (g) => {
      console.log('[ARAssembly] Guide ready:', g.deviceName);
      guideRef.current = g;
      setLiveGuide(g);
      goToStep(0);
    },

    onAudioChunk: (audioBase64) => {
      enqueueChunk(audioBase64);
    },

    onToolCall: (name, args, callId) => {
      console.log('[ARAssembly] Tool call:', name, args);
      switch (name) {
        case 'nextStep':
          goToStep(stepIndexRef.current + 1);
          break;
        case 'prevStep':
          goToStep(stepIndexRef.current - 1);
          break;
        case 'goToStep': {
          const a = args as { index: number };
          goToStep(a.index);
          break;
        }
        case 'highlightPart':
          console.log('[ARAssembly] highlightPart:', args);
          break;
        case 'markStepComplete':
          console.log('[ARAssembly] Step marked complete:', stepIndexRef.current);
          break;
        default:
          console.warn('[ARAssembly] Unknown tool:', name);
      }
      // Always acknowledge the tool call so Gemini can continue
      session.sendToolResponse(callId, { success: true });
    },

    onTranscript: (speaker, text) => {
      console.log(`[ARAssembly] Transcript (${speaker}): ${text}`);
    },

    onError: (message) => {
      console.warn('[ARAssembly] Error:', message);
      setError(message);
    },

    onSessionEnd: () => {
      console.log('[ARAssembly] Session ended (keeping guide visible)');
      flush();
      // Don't navigate away or reset — keep the guide on screen
    },
  });

  // ── Connect on mount, disconnect on unmount ───────────────
  useEffect(() => {
    session.connect();
    setConnected(true);
    return () => {
      session.disconnect();
    };
  }, []);

  // ── Camera callbacks ──────────────────────────────────────
  const handleFrame = useCallback(
    (frame: { base64: string; width: number; height: number; timestamp: number }) => {
      session.sendFrame(frame.base64);
    },
    [session],
  );

  const handleMicAudio = useCallback(
    (base64Pcm: string) => {
      session.sendAudio(base64Pcm);
    },
    [session],
  );

  const handleCameraError = useCallback(
    (message: string) => {
      setError(message);
    },
    [],
  );

  // ── UI handlers ───────────────────────────────────────────
  const handleNext = () => {
    if (currentStepIndex < guide.steps.length - 1) {
      goToStep(currentStepIndex + 1);
    } else {
      onFinish?.();
    }
  };

  const handleRepeatAudio = () => {
    flush();
  };

  // Clear error after a delay
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  return (
    <View style={styles.container}>
      {/* ── Camera zone ───────────────────────────── */}
      <View style={styles.cameraZone}>
        <IDIYCameraView
          currentStep={step ?? null}
          onFrame={handleFrame}
          onAudioChunk={handleMicAudio}
          onError={handleCameraError}
        />

        {/* Top progress bar — overlaid on camera */}
        <View style={styles.progressBar}>
          <LinearGradient
            colors={Colors.gradientPurplePink}
            style={[styles.progressFill, { width: `${progress * 100}%` }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>

        {/* Step counter chip */}
        <View style={styles.stepChip}>
          <Text style={styles.stepChipText}>
            Step {currentStepIndex + 1}/{guide.steps.length}
          </Text>
        </View>

        {/* Mic indicator */}
        <View style={styles.micBadge}>
          <View style={[styles.micDot, connected && styles.micDotLive]} />
          <Ionicons name="mic" size={14} color={Colors.white} />
        </View>

        {/* Connection overlay — shown while waiting for server guide */}
        {!liveGuide && (
          <View style={styles.connectionOverlay} pointerEvents="none">
            <Text style={styles.connectionText}>
              {connected ? 'Connecting to server...' : 'Disconnected'}
            </Text>
          </View>
        )}

        {/* Error banner */}
        {error && (
          <View style={styles.errorBanner} pointerEvents="none">
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>

      {/* ── Step panel ────────────────────────────── */}
      <View style={styles.panel}>
        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          {/* Step number + title */}
          <View style={styles.stepHeader}>
            <LinearGradient
              colors={Colors.gradientPurplePink}
              style={styles.stepNumBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.stepNumText}>{currentStepIndex + 1}</Text>
            </LinearGradient>
            <View style={styles.stepTitleBlock}>
              <Text style={styles.stepTitle}>{step?.title}</Text>
              <View style={styles.stepMeta}>
                <Ionicons name="time-outline" size={13} color={Colors.textLight} />
                <Text style={styles.stepMetaText}>~{step?.durationMin} min</Text>
                {step?.parts?.length > 0 && (
                  <>
                    <View style={styles.metaDot} />
                    <Ionicons name="cube-outline" size={13} color={Colors.textLight} />
                    <Text style={styles.stepMetaText}>
                      {step.parts.length} part{step.parts.length > 1 ? 's' : ''}
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>

          <Text style={styles.stepDesc}>{step?.description}</Text>

          {/* Step dots timeline */}
          <View style={styles.timeline}>
            {guide.steps.map((s, i) => (
              <View key={i} style={styles.timelineDotWrap}>
                {i === currentStepIndex ? (
                  <LinearGradient
                    colors={Colors.gradientPurplePink}
                    style={styles.timelineDotActive}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.timelineDotNum}>{i + 1}</Text>
                  </LinearGradient>
                ) : i < currentStepIndex ? (
                  <View style={[styles.timelineDot, styles.timelineDotDone]}>
                    <Ionicons name="checkmark" size={10} color={Colors.white} />
                  </View>
                ) : (
                  <View style={styles.timelineDot}>
                    <Text style={styles.timelineDotNumInactive}>{i + 1}</Text>
                  </View>
                )}
                {i < guide.steps.length - 1 && (
                  <View
                    style={[styles.timelineLine, i < currentStepIndex && styles.timelineLineDone]}
                  />
                )}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.repeatBtn} onPress={handleRepeatAudio}>
            <Ionicons name="volume-medium-outline" size={18} color={Colors.purple} />
            <Text style={styles.repeatBtnText}>Repeat Audio</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
            <LinearGradient
              colors={Colors.gradientPurplePink}
              style={styles.nextBtnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.nextBtnText}>
                {currentStepIndex === guide.steps.length - 1 ? 'Finish' : 'Next Step'}
              </Text>
              <Ionicons
                name={
                  currentStepIndex === guide.steps.length - 1
                    ? 'checkmark-circle'
                    : 'arrow-forward'
                }
                size={18}
                color={Colors.white}
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },

  // ── Camera zone ───────────────────────────────────────────
  cameraZone: {
    height: '42%',
    backgroundColor: '#1A1A2E',
    overflow: 'hidden',
  },

  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  progressFill: { height: 3 },

  stepChip: {
    position: 'absolute',
    top: Spacing.md,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  stepChipText: { fontSize: 12, fontWeight: '700', color: Colors.white },

  micBadge: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  micDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.textLight },
  micDotLive: { backgroundColor: Colors.teal },

  connectionOverlay: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
  },
  connectionText: { color: Colors.white, fontSize: 13, opacity: 0.8 },

  errorBanner: {
    position: 'absolute',
    top: Spacing.xl + Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: 'rgba(200,0,0,0.75)',
    borderRadius: Radius.sm,
    padding: 10,
  },
  errorText: { color: Colors.white, fontSize: 13 },

  // ── Step panel ────────────────────────────────────────────
  panel: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    ...Shadow.cardLarge,
  },

  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  stepNumBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { fontSize: 18, fontWeight: '800', color: Colors.white },
  stepTitleBlock: { flex: 1 },
  stepTitle: { fontSize: 17, fontWeight: '700', color: Colors.textDark },
  stepMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  stepMetaText: { fontSize: 12, color: Colors.textLight },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.borderLight,
  },

  stepDesc: {
    fontSize: 14,
    color: Colors.textGray,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },

  // Timeline dots
  timeline: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  timelineDotWrap: { flexDirection: 'row', alignItems: 'center' },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  timelineDotActive: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotDone: { backgroundColor: Colors.purple, borderColor: Colors.purple },
  timelineDotNum: { fontSize: 11, fontWeight: '800', color: Colors.white },
  timelineDotNumInactive: { fontSize: 11, fontWeight: '600', color: Colors.textLight },
  timelineLine: {
    width: 16,
    height: 2,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 2,
  },
  timelineLineDone: { backgroundColor: Colors.purple },

  // Actions
  actions: { flexDirection: 'row', gap: Spacing.md, paddingTop: Spacing.sm },
  repeatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.purpleLight,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.purpleLight,
  },
  repeatBtnText: { fontSize: 14, fontWeight: '600', color: Colors.purple },
  nextBtn: { flex: 1, borderRadius: Radius.lg, overflow: 'hidden' },
  nextBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm + 4,
    gap: 8,
  },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
});
