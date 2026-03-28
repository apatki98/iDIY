import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import { InputCard } from '../components/InputCard';
import { BottomNavBar } from '../components/BottomNavBar';

interface ProductInputScreenProps {
  onSubmitUrl?: (url: string) => void;
  onSearch?: () => void;
  onScan?: () => void;
}

export function ProductInputScreen({ onSubmitUrl, onSearch, onScan }: ProductInputScreenProps) {
  const [url, setUrl] = useState('');

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Ionicons name="home" size={20} color={Colors.lavender} />
            </View>
            <Text style={Typography.h2}>New Assembly</Text>
          </View>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[Typography.body, styles.subtitle]}>
            How would you like to load your product?
          </Text>

          {/* Card 1: Paste URL */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: Colors.lavenderLight }]}>
                <Ionicons name="link" size={26} color={Colors.lavender} />
              </View>
              <View style={styles.cardText}>
                <Text style={Typography.bodyBold}>Paste Product URL</Text>
                <Text style={Typography.caption}>Wayfair, IKEA, Amazon, etc.</Text>
              </View>
            </View>
            <View style={styles.urlInputRow}>
              <TextInput
                style={styles.urlInput}
                placeholder="https://www.ikea.com/us/en/p/..."
                placeholderTextColor={Colors.textLight}
                value={url}
                onChangeText={setUrl}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Ionicons
                name="arrow-forward-circle"
                size={32}
                color={url.length > 0 ? Colors.lavender : Colors.borderLight}
                onPress={() => url.length > 0 && onSubmitUrl?.(url)}
              />
            </View>
          </View>

          {/* Card 2: Search Name */}
          <InputCard
            icon="search"
            iconColor={Colors.softGreen}
            title="Search Product Name + Model"
            subtitle="e.g. IKEA MALM 6-drawer dresser"
            onPress={onSearch}
          />

          {/* Card 3: Scan Code */}
          <InputCard
            icon="barcode-outline"
            iconColor={Colors.softPink}
            title="Scan Box Barcode"
            subtitle="Point your camera at the barcode or QR code"
            onPress={onScan}
          />
        </ScrollView>

        <BottomNavBar activeTab="home" />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.lavenderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  content: {
    padding: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  subtitle: {
    marginBottom: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  cardText: {
    flex: 1,
  },
  urlInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  urlInput: {
    flex: 1,
    height: 44,
    borderWidth: 1.5,
    borderColor: Colors.borderBlue,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    marginRight: Spacing.sm,
    fontSize: 14,
    color: Colors.textDark,
    backgroundColor: Colors.white,
  },
});
