import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../theme';

interface ChecklistItemProps {
  name: string;
  quantity?: number;
  imageUrl?: string;
  checked: boolean;
  onToggle: () => void;
}

export function ChecklistItem({ name, quantity, imageUrl, checked, onToggle }: ChecklistItemProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onToggle} activeOpacity={0.6}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Ionicons name="checkmark" size={16} color={Colors.textWhite} />}
      </View>
      {imageUrl && <Image source={{ uri: imageUrl }} style={styles.thumbnail} />}
      <Text style={[Typography.body, checked && styles.textChecked]} numberOfLines={1}>
        {name}
        {quantity != null && quantity > 1 ? ` × ${quantity}` : ''}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: Colors.softGreen,
    borderColor: Colors.softGreen,
  },
  thumbnail: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    marginRight: Spacing.sm,
    backgroundColor: Colors.borderLight,
  },
  textChecked: {
    textDecorationLine: 'line-through',
    color: Colors.textLight,
  },
});
