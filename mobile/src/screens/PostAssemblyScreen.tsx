import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import { GuideJSON } from '../types/guide';

interface PostAssemblyScreenProps {
  guide: GuideJSON;
  errorsCount?: number;
  onSaveToInventory?: () => void;
  onShareReplay?: () => void;
  onViewSummary?: () => void;
  onWatchReplay?: () => void;
}

function ConfettiDot({ delay, left }: { delay: number; left: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [anim, delay]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 300],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [1, 0.6, 0],
  });

  const colors = [Colors.lavender, Colors.softGreen, Colors.softPink, Colors.softBlue, Colors.gold];
  const color = colors[Math.floor(left / 20) % colors.length];

  return (
    <Animated.View
      style={[
        styles.confettiDot,
        {
          left: `${left}%`,
          backgroundColor: color,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    />
  );
}

export function PostAssemblyScreen({
  guide,
  errorsCount = 0,
  onSaveToInventory,
  onShareReplay,
  onViewSummary,
  onWatchReplay,
}: PostAssemblyScreenProps) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Confetti area */}
        <View style={styles.confettiZone}>
          {[5, 15, 25, 35, 45, 55, 65, 75, 85, 95].map((left, i) => (
            <ConfettiDot key={i} delay={i * 300} left={left} />
          ))}

          {/* Celebration header */}
          <View style={styles.celebrationContent}>
            <Ionicons name="trophy" size={48} color={Colors.gold} />
            <Text style={[Typography.h1, styles.congrats]}>You did it!</Text>
            <Text style={[Typography.h3, styles.productName]}>{guide.deviceName}</Text>
            <Text style={[Typography.body, styles.fullyAssembled]}>Fully Assembled</Text>
          </View>
        </View>

        {/* Product snapshot placeholder */}
        <View style={styles.productImage}>
          <Ionicons name="image-outline" size={40} color={Colors.textLight} />
          <Text style={Typography.caption}>Completed product snapshot</Text>
        </View>

        {/* Summary cards */}
        <TouchableOpacity style={styles.deliverableCard} onPress={onViewSummary}>
          <View style={[styles.deliverableIcon, { backgroundColor: Colors.lavenderLight }]}>
            <Ionicons name="document-text-outline" size={24} color={Colors.lavender} />
          </View>
          <View style={styles.deliverableText}>
            <Text style={Typography.bodyBold}>Assembly Summary</Text>
            <Text style={Typography.caption}>
              {guide.steps.length} steps completed · {errorsCount} error{errorsCount !== 1 ? 's' : ''} flagged
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.deliverableCard} onPress={onWatchReplay}>
          <View style={[styles.deliverableIcon, { backgroundColor: Colors.lightBlue }]}>
            <Ionicons name="videocam-outline" size={24} color={Colors.softBlue} />
          </View>
          <View style={styles.deliverableText}>
            <Text style={Typography.bodyBold}>Session Replay</Text>
            <Text style={Typography.caption}>
              Watch your assembly with chapter markers
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
        </TouchableOpacity>

        {/* Action buttons */}
        <TouchableOpacity style={styles.primaryButton} onPress={onSaveToInventory}>
          <Ionicons name="home-outline" size={20} color={Colors.textWhite} />
          <Text style={[Typography.button, { marginLeft: 8 }]}>
            Save to Home Inventory & Clear Session
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={onShareReplay}>
          <Ionicons name="share-outline" size={20} color={Colors.lavender} />
          <Text style={[Typography.bodyBold, { color: Colors.lavender, marginLeft: 8 }]}>
            Share Replay Video
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  scroll: {
    paddingBottom: Spacing.xxl,
  },
  confettiZone: {
    height: 240,
    overflow: 'hidden',
    backgroundColor: Colors.lavenderLight,
  },
  confettiDot: {
    position: 'absolute',
    top: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  celebrationContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  congrats: {
    marginTop: Spacing.md,
    color: Colors.textDark,
  },
  productName: {
    marginTop: Spacing.xs,
    color: Colors.textGray,
  },
  fullyAssembled: {
    marginTop: 2,
    color: Colors.softGreen,
    fontWeight: '600',
  },
  productImage: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 140,
    marginHorizontal: Spacing.lg,
    marginTop: -Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    ...Shadow.card,
  },
  deliverableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    ...Shadow.card,
  },
  deliverableIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  deliverableText: {
    flex: 1,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.softGreen,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.lavender,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
});
