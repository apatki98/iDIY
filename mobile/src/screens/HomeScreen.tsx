import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '../theme';

interface HomeScreenProps {
  onStartAssembly?: () => void;
}

const INPUT_METHODS = [
  { key: 'url',    icon: 'link'    as const, title: 'Paste URL',          subtitle: 'IKEA, Wayfair, Amazon...' },
  { key: 'search', icon: 'text'    as const, title: 'Type Product Name',  subtitle: 'Search by name or model'  },
  { key: 'scan',   icon: 'barcode' as const, title: 'Scan Barcode',       subtitle: 'Use your camera'          },
];

// ── Demo / mock data ──────────────────────────────────────────
const WIP = {
  name: 'IKEA MALM 6-drawer Dresser',
  progress: 0.45,          // 45 %
  stepsDone: 4,
  stepsTotal: 9,
  timeLeft: '~25 min left',
  icon: 'cube' as const,
};

const HISTORY = [
  { id: '1', name: 'KALLAX Shelf',      icon: 'library-outline'     as const, tag: 'Completed' },
  { id: '2', name: 'BILLY Bookcase',    icon: 'book-outline'        as const, tag: 'Completed' },
  { id: '3', name: 'HEMNES Bed Frame',  icon: 'bed-outline'         as const, tag: 'Completed' },
  { id: '4', name: 'LACK Side Table',   icon: 'tablet-landscape-outline' as const, tag: 'Completed' },
  { id: '5', name: 'PAX Wardrobe',      icon: 'shirt-outline'       as const, tag: 'Completed' },
];

// ── Sub-components ────────────────────────────────────────────
function WIPCard() {
  return (
    <View style={styles.wipCard}>
      <View style={styles.wipTop}>
        <LinearGradient
          colors={Colors.gradientPurplePink}
          style={styles.wipIcon}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={WIP.icon} size={20} color={Colors.white} />
        </LinearGradient>
        <View style={styles.wipInfo}>
          <Text style={styles.wipName} numberOfLines={1}>{WIP.name}</Text>
          <Text style={styles.wipMeta}>
            Step {WIP.stepsDone} of {WIP.stepsTotal} · {WIP.timeLeft}
          </Text>
        </View>
        <TouchableOpacity>
          <LinearGradient
            colors={Colors.gradientPurplePink}
            style={styles.resumeBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.resumeText}>Resume</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <LinearGradient
          colors={Colors.gradientPurplePink}
          style={[styles.progressFill, { width: `${WIP.progress * 100}%` }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </View>
      <Text style={styles.progressPct}>{Math.round(WIP.progress * 100)}% complete</Text>
    </View>
  );
}

function HistoryScroll() {
  return (
    <View style={styles.historySection}>
      <Text style={styles.sectionLabel}>Previously Built</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyScroll}>
        {HISTORY.map((item) => (
          <TouchableOpacity key={item.id} style={styles.historyItem} activeOpacity={0.7}>
            <LinearGradient
              colors={Colors.gradientTeal}
              style={styles.historyIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name={item.icon} size={22} color={Colors.white} />
            </LinearGradient>
            <Text style={styles.historyName} numberOfLines={2}>{item.name}</Text>
            <View style={styles.historyTag}>
              <Ionicons name="checkmark-circle" size={11} color={Colors.teal} />
              <Text style={styles.historyTagText}>{item.tag}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────
export function HomeScreen({ onStartAssembly }: HomeScreenProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} bounces>
        {/* Hero */}
        <LinearGradient
          colors={Colors.gradientHero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.logoText}><Text style={styles.logoBold}>I DIY</Text></Text>
          <Text style={styles.tagline}>Your guide — let's build it together.</Text>

          <TouchableOpacity style={styles.startButton} onPress={() => setShowModal(true)} activeOpacity={0.85}>
            <Ionicons name="add-circle" size={22} color={Colors.purple} />
            <Text style={styles.startButtonText}>Start New Assembly</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Work in Progress */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>In Progress</Text>
            <View style={styles.wipBadge}><Text style={styles.wipBadgeText}>1 active</Text></View>
          </View>
          <WIPCard />
        </View>

        {/* History */}
        <HistoryScroll />

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* Input method bottom sheet */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowModal(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>How do you want to add your product?</Text>
              <Text style={styles.sheetSub}>Choose an input method to get started</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={20} color={Colors.textGray} />
              </TouchableOpacity>
            </View>
            {INPUT_METHODS.map((method) => (
              <TouchableOpacity
                key={method.key}
                style={styles.methodRow}
                activeOpacity={0.7}
                onPress={() => { setShowModal(false); onStartAssembly?.(); }}
              >
                <LinearGradient colors={Colors.gradientPurplePink} style={styles.methodIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Ionicons name={method.icon} size={22} color={Colors.white} />
                </LinearGradient>
                <View style={styles.methodText}>
                  <Text style={styles.methodTitle}>{method.title}</Text>
                  <Text style={styles.methodSub}>{method.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },

  // Hero
  hero: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl + Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  logoText: { fontSize: 36, color: Colors.textWhite, letterSpacing: -0.5 },
  logoBold: { fontWeight: '800' },
  tagline: { fontSize: 16, color: 'rgba(255,255,255,0.82)', marginBottom: Spacing.lg },
  startButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    paddingVertical: Spacing.md + 2, paddingHorizontal: Spacing.xl,
    gap: Spacing.sm, ...Shadow.card,
  },
  startButtonText: { fontSize: 16, fontWeight: '700', color: Colors.purple },

  // Sections
  section: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  sectionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: Spacing.sm },
  sectionLabel: { fontSize: 16, fontWeight: '700', color: Colors.textDark },
  wipBadge: { backgroundColor: Colors.purpleLight, paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full },
  wipBadgeText: { fontSize: 12, fontWeight: '600', color: Colors.purple },

  // WIP card
  wipCard: {
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    padding: Spacing.md, ...Shadow.card,
  },
  wipTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  wipIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  wipInfo: { flex: 1 },
  wipName: { fontSize: 14, fontWeight: '700', color: Colors.textDark },
  wipMeta: { fontSize: 12, color: Colors.textGray, marginTop: 2 },
  resumeBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full },
  resumeText: { fontSize: 13, fontWeight: '700', color: Colors.white },
  progressTrack: { height: 6, backgroundColor: Colors.borderLight, borderRadius: Radius.full, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: Radius.full },
  progressPct: { fontSize: 12, color: Colors.textLight, marginTop: 6, textAlign: 'right' },

  // History
  historySection: { paddingTop: Spacing.lg },
  historyScroll: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  historyItem: {
    width: 100, backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: Spacing.md, alignItems: 'center', gap: Spacing.sm, ...Shadow.card,
  },
  historyIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  historyName: { fontSize: 12, fontWeight: '600', color: Colors.textDark, textAlign: 'center', lineHeight: 16 },
  historyTag: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  historyTagText: { fontSize: 11, color: Colors.teal, fontWeight: '600' },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.white, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  handle: { width: 40, height: 4, backgroundColor: Colors.borderLight, borderRadius: Radius.full, alignSelf: 'center', marginVertical: Spacing.md },
  sheetHeader: { marginBottom: Spacing.lg },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: Colors.textDark },
  sheetSub: { fontSize: 14, color: Colors.textGray, marginTop: 4 },
  closeBtn: { position: 'absolute', right: 0, top: 0, padding: Spacing.xs },
  methodRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.cream, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.md },
  methodIcon: { width: 52, height: 52, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  methodText: { flex: 1 },
  methodTitle: { fontSize: 15, fontWeight: '600', color: Colors.textDark },
  methodSub: { fontSize: 13, color: Colors.textGray, marginTop: 2 },
});
