import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';

type ErrorType = 'correction' | 'safety';

interface ErrorDetectionScreenProps {
  type: ErrorType;
  message: string;
  onAcknowledge?: () => void;
  onDismiss?: () => void;
}

export function ErrorDetectionScreen({
  type,
  message,
  onAcknowledge,
  onDismiss,
}: ErrorDetectionScreenProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  if (type === 'correction') {
    return (
      <View style={styles.container}>
        {/* Dimmed camera background */}
        <View style={styles.cameraPlaceholder}>
          <Ionicons name="camera" size={48} color={Colors.textLight} />
        </View>

        {/* Orange bounding box indicator */}
        <View style={styles.orangeBoundingBox} />

        {/* Correction card */}
        <View style={styles.correctionCard}>
          <View style={styles.correctionHeader}>
            <Ionicons name="alert-circle" size={22} color={Colors.softOrange} />
            <Text style={[Typography.bodyBold, { color: Colors.softOrange, marginLeft: 8 }]}>
              Correction
            </Text>
          </View>
          <Text style={[Typography.body, styles.correctionMessage]}>{message}</Text>
          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Text style={[Typography.caption, { color: Colors.textLight }]}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Safety Hard Stop
  return (
    <View style={styles.container}>
      {/* Camera with red overlay */}
      <View style={styles.cameraPlaceholder}>
        <Ionicons name="camera" size={48} color={Colors.textLight} />
      </View>
      <View style={styles.redOverlay} />

      {/* Safety card */}
      <View style={styles.safetyCard}>
        <View style={styles.safetyHeader}>
          <Ionicons name="warning" size={24} color={Colors.textWhite} />
          <Text style={styles.safetyTitle}>SAFETY WARNING</Text>
        </View>
        <View style={styles.safetyBody}>
          <Text style={[Typography.bodyBold, styles.safetyMessage]}>{message}</Text>
          <TouchableOpacity
            style={[styles.acknowledgeButton, acknowledged && styles.acknowledgedButton]}
            onPress={() => {
              setAcknowledged(true);
              onAcknowledge?.();
            }}
            disabled={acknowledged}
          >
            <Ionicons
              name={acknowledged ? 'checkmark-circle' : 'hand-left'}
              size={20}
              color={Colors.textWhite}
            />
            <Text style={[Typography.button, { marginLeft: 8 }]}>
              {acknowledged ? 'Acknowledged' : 'Acknowledge Safety Warning & Pause'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  cameraPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2A',
  },

  // ─── Correction (orange) ────────────────────────────────
  orangeBoundingBox: {
    position: 'absolute',
    top: '25%',
    left: '20%',
    width: '30%',
    height: '18%',
    borderWidth: 2.5,
    borderColor: Colors.softOrange,
    borderRadius: Radius.sm,
  },
  correctionCard: {
    position: 'absolute',
    right: Spacing.md,
    top: '35%',
    width: '55%',
    backgroundColor: Colors.lightOrange,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.card,
  },
  correctionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  correctionMessage: {
    color: Colors.textDark,
    marginBottom: Spacing.sm,
  },
  dismissButton: {
    alignSelf: 'flex-end',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },

  // ─── Safety Hard Stop (red) ─────────────────────────────
  redOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.redOverlay,
  },
  safetyCard: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    top: '30%',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.cardLarge,
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.softRed,
    paddingVertical: Spacing.md,
  },
  safetyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textWhite,
    marginLeft: Spacing.sm,
    letterSpacing: 1,
  },
  safetyBody: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
  },
  safetyMessage: {
    color: Colors.textDark,
    marginBottom: Spacing.lg,
    lineHeight: 24,
  },
  acknowledgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.softRed,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
  },
  acknowledgedButton: {
    backgroundColor: Colors.textLight,
  },
});
