import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../theme';

type Tab = 'home' | 'profile' | 'help';

interface BottomNavBarProps {
  activeTab?: Tab;
  onTabPress?: (tab: Tab) => void;
}

const tabs: { key: Tab; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { key: 'home', icon: 'home-outline', label: 'Home' },
  { key: 'profile', icon: 'person-outline', label: 'Profile' },
  { key: 'help', icon: 'help-circle-outline', label: 'Help' },
];

export function BottomNavBar({ activeTab = 'home', onTabPress }: BottomNavBarProps) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={styles.tab}
          onPress={() => onTabPress?.(tab.key)}
        >
          <Ionicons
            name={activeTab === tab.key ? (tab.icon.replace('-outline', '') as any) : tab.icon}
            size={24}
            color={activeTab === tab.key ? Colors.lavender : Colors.textLight}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingBottom: Spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.lg,
  },
});
