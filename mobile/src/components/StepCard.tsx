import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import { Step } from '../types/guide';

interface StepCardProps {
  step: Step;
  totalSteps: number;
  onRepeatAudio?: () => void;
  onNextStep?: () => void;
  isLastStep?: boolean;
}

export function StepCard({ step, totalSteps, onRepeatAudio, onNextStep, isLastStep }: StepCardProps) {
  return (
    <View style={styles.container}>
      <Text style={[Typography.h3, styles.title]}>{step.title}</Text>
      <Text style={[Typography.body, styles.description]}>{step.description}</Text>

      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color={Colors.textLight} />
          <Text style={[Typography.caption, styles.metaText]}>~{step.durationMin} min</Text>
        </View>
        {step.parts.length > 0 && (
          <View style={styles.metaItem}>
            <Ionicons name="cube-outline" size={14} color={Colors.textLight} />
            <Text style={[Typography.caption, styles.metaText]}>
              {step.parts.length} part{step.parts.length > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.repeatButton} onPress={onRepeatAudio}>
          <Ionicons name="volume-medium-outline" size={18} color={Colors.lavender} />
          <Text style={[Typography.bodyBold, { color: Colors.lavender, marginLeft: 6 }]}>
            Repeat Audio
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={onNextStep}>
          <Text style={[Typography.button, { color: Colors.textWhite }]}>
            {isLastStep ? 'Finish' : 'Next Step'}
          </Text>
          <Ionicons
            name={isLastStep ? 'checkmark-circle' : 'arrow-forward'}
            size={18}
            color={Colors.textWhite}
            style={{ marginLeft: 6 }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    ...Shadow.cardLarge,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  description: {
    marginBottom: Spacing.md,
  },
  meta: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  metaText: {
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  repeatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lavenderLight,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lavender,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
  },
});
