import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import { GuideJSON } from '../types/guide';

interface PreAssemblyChecklistScreenProps {
  guide: GuideJSON;
  onReady?: () => void;
  onMissingPart?: (partId: string) => void;
}

function CounterBadge({ checked, total, color }: { checked: number; total: number; color: [string, string] }) {
  return (
    <LinearGradient colors={color} style={styles.counterBadge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <Text style={styles.counterText}>{checked}/{total}</Text>
    </LinearGradient>
  );
}

function PartRow({
  name,
  quantity,
  required,
  checked,
  onToggle,
  onFlag,
}: {
  name: string;
  quantity?: number;
  required?: boolean;
  checked: boolean;
  onToggle: () => void;
  onFlag?: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.itemRow, checked && styles.itemRowChecked]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Ionicons name="checkmark" size={14} color={Colors.white} />}
      </View>

      <Text style={[styles.itemName, checked && styles.itemNameChecked]} numberOfLines={1}>
        {name}
      </Text>

      {quantity != null && quantity > 1 && (
        <View style={styles.qtyBadge}>
          <Text style={styles.qtyText}>×{quantity}</Text>
        </View>
      )}

      {required && !checked && (
        <View style={styles.requiredBadge}>
          <Text style={styles.requiredText}>Required</Text>
        </View>
      )}

      {!checked && onFlag && (
        <TouchableOpacity onPress={onFlag} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="warning-outline" size={18} color={Colors.textLight} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

export function PreAssemblyChecklistScreen({
  guide,
  onReady,
  onMissingPart,
}: PreAssemblyChecklistScreenProps) {
  const [checkedParts, setCheckedParts] = useState<Set<string>>(new Set());
  const [checkedTools, setCheckedTools] = useState<Set<string>>(new Set());
  const [missingPartId, setMissingPartId] = useState<string | null>(null);

  const togglePart = (id: string) =>
    setCheckedParts((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleTool = (id: string) =>
    setCheckedTools((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const allChecked = useMemo(
    () =>
      guide.parts.every((p) => checkedParts.has(p.id)) &&
      guide.tools.filter((t) => t.required).every((t) => checkedTools.has(t.id)),
    [checkedParts, checkedTools, guide],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.heading}>Pre-Assembly Checklist</Text>
        <Text style={[Typography.body, { marginBottom: Spacing.md }]}>{guide.deviceName}</Text>

        {/* Time + steps summary */}
        <View style={styles.summaryRow}>
          <LinearGradient colors={Colors.gradientPurplePink} style={styles.summaryCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="time-outline" size={20} color={Colors.white} />
            <Text style={styles.summaryValue}>{guide.totalMinutes} min</Text>
            <Text style={styles.summaryLabel}>Est. Time</Text>
          </LinearGradient>
          <LinearGradient colors={Colors.gradientTeal} style={styles.summaryCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="list-outline" size={20} color={Colors.white} />
            <Text style={styles.summaryValue}>{guide.steps.length}</Text>
            <Text style={styles.summaryLabel}>Steps</Text>
          </LinearGradient>
          <View style={[styles.summaryCard, { backgroundColor: Colors.softYellow }]}>
            <Ionicons name="people-outline" size={20} color="#92400E" />
            <Text style={[styles.summaryValue, { color: '#92400E' }]}>{guide.requiresTwoPeople ? '2' : '1'}</Text>
            <Text style={[styles.summaryLabel, { color: '#92400E' }]}>Person{guide.requiresTwoPeople ? 's' : ''}</Text>
          </View>
        </View>

        {/* Two-person warning */}
        {guide.requiresTwoPeople && (
          <View style={styles.warningBanner}>
            <Ionicons name="alert-circle" size={18} color="#92400E" />
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <Text style={styles.warningTitle}>Two-Person Requirement</Text>
              <Text style={styles.warningBody}>
                Steps {guide.twoPersonSteps.join(' & ')} require lifting. Ensure a helper is available.
              </Text>
            </View>
          </View>
        )}

        {/* Pro Tip */}
        <View style={styles.proTipCard}>
          <Ionicons name="phone-portrait-outline" size={22} color="#F59E0B" />
          <View style={styles.proTipText}>
            <Text style={styles.proTipTitle}>Pro Tip</Text>
            <Text style={styles.proTipBody}>
              Keep your phone propped up or use a stand for the best hands-free experience.
            </Text>
          </View>
        </View>

        {/* Parts section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={Colors.gradientPurplePink}
              style={styles.sectionIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="cube-outline" size={18} color={Colors.white} />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Included Parts</Text>
            <CounterBadge
              checked={checkedParts.size}
              total={guide.parts.length}
              color={Colors.gradientTeal}
            />
          </View>

          {guide.parts.map((part) => (
            <PartRow
              key={part.id}
              name={part.name}
              quantity={part.quantity}
              required
              checked={checkedParts.has(part.id)}
              onToggle={() => togglePart(part.id)}
              onFlag={() => setMissingPartId(part.id)}
            />
          ))}
        </View>

        {/* Tools section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={Colors.gradientTeal}
              style={styles.sectionIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="build-outline" size={18} color={Colors.white} />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Tools Required</Text>
            <CounterBadge
              checked={checkedTools.size}
              total={guide.tools.length}
              color={Colors.gradientTeal}
            />
          </View>

          {guide.tools.map((tool) => (
            <PartRow
              key={tool.id}
              name={tool.name}
              required={tool.required}
              checked={checkedTools.has(tool.id)}
              onToggle={() => toggleTool(tool.id)}
            />
          ))}
        </View>

        {/* Missing part card */}
        {missingPartId && (
          <View style={styles.missingCard}>
            <Text style={[Typography.bodyBold, { color: Colors.softRed }]}>
              ⚠ Missing Part
            </Text>
            <Text style={[Typography.body, { marginVertical: Spacing.sm }]}>
              {guide.parts.find((p) => p.id === missingPartId)?.name}
            </Text>
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <TouchableOpacity
                style={[styles.missingBtn, { backgroundColor: Colors.purpleLight }]}
                onPress={() => onMissingPart?.(missingPartId)}
              >
                <Text style={[Typography.bodyBold, { color: Colors.purple, fontSize: 13 }]}>
                  Draft Complaint
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.missingBtn, { backgroundColor: Colors.tealLight }]}
              >
                <Text style={[Typography.bodyBold, { color: Colors.teal, fontSize: 13 }]}>
                  Find Alternatives
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* CTA */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity onPress={onReady} activeOpacity={0.85}>
          <LinearGradient
            colors={allChecked ? Colors.gradientPurplePink : ['#C4B5FD', '#F9A8D4']}
            style={styles.ctaButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.ctaText}>I have everything — Let's start!</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  scroll: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: Spacing.xs,
  },

  // Pro Tip
  proTipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  proTipText: { flex: 1 },
  proTipTitle: { fontSize: 14, fontWeight: '700', color: Colors.textDark, marginBottom: 4 },
  proTipBody: { fontSize: 13, color: Colors.textGray, lineHeight: 20 },

  // Time summary
  summaryRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  summaryCard: {
    flex: 1, borderRadius: Radius.lg, padding: Spacing.md,
    alignItems: 'center', gap: 4,
  },
  summaryValue: { fontSize: 20, fontWeight: '800', color: Colors.white },
  summaryLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },

  // Warning
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  warningTitle: {
    fontWeight: '700',
    fontSize: 14,
    color: '#92400E',
  },
  warningBody: {
    fontSize: 13,
    color: '#92400E',
    marginTop: 2,
  },

  // Section
  section: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadow.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
  },
  counterBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  counterText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },

  // Item rows
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  itemRowChecked: {
    backgroundColor: Colors.purpleLight,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: Colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.purple,
    borderColor: Colors.purple,
  },
  itemName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textDark,
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: Colors.textLight,
  },
  qtyBadge: {
    backgroundColor: Colors.teal,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  qtyText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  requiredBadge: {
    backgroundColor: Colors.purpleLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  requiredText: {
    color: Colors.purple,
    fontSize: 12,
    fontWeight: '600',
  },

  // Missing card
  missingCard: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.softRed,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  missingBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },

  // CTA
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  ctaButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md + 2,
    borderRadius: Radius.xl,
  },
  ctaText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
