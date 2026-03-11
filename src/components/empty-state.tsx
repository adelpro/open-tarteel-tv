import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getThemeColors } from '../constants/theme';
import { colorPrimary } from '../constants/interaction-colors';

type EmptyStateProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
};

export default function EmptyState({ icon, title, message }: EmptyStateProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== 'light';
  const { width } = useWindowDimensions();
  const { textPrimary, textSecondary } = getThemeColors(isDark);

  const isVeryWide = width >= 2800;
  const isWide = width >= 2200 && width < 2800;

  const iconSize = isVeryWide ? 96 : isWide ? 80 : 64;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: isVeryWide ? 60 : isWide ? 48 : 40,
          paddingHorizontal: 40,
        },
        iconCircle: {
          width: iconSize * 2,
          height: iconSize * 2,
          borderRadius: iconSize,
          backgroundColor: isDark
            ? 'rgba(1, 144, 221, 0.1)'
            : 'rgba(1, 144, 221, 0.08)',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: isVeryWide ? 24 : 16,
        },
        title: {
          fontSize: isVeryWide ? 28 : isWide ? 24 : 20,
          fontWeight: '700',
          color: textPrimary,
          marginTop: 8,
          marginBottom: 8,
          textAlign: 'center',
        },
        message: {
          fontSize: isVeryWide ? 20 : isWide ? 18 : 16,
          color: textSecondary,
          textAlign: 'center',
          lineHeight: isVeryWide ? 28 : 22,
          maxWidth: 400,
        },
      }),
    [isDark, width, textPrimary, textSecondary],
  );

  return (
    <View style={styles.container} accessibilityRole="summary">
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={iconSize} color={colorPrimary} />
      </View>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}
