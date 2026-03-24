import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions } from 'react-native';

import { SpatialNavigationFocusableView } from 'react-tv-space-navigation';

import {
  colorPrimary,
  colorPrimaryDark,
  colorPrimaryTint,
  focusScale,
} from '../constants/interaction-colors';
import { getThemeColors } from '../constants/theme';
import { useSettings } from '../context/settings.context';

type FilterChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

const FilterChip = ({ label, selected, onPress }: FilterChipProps) => {
  const { isDark } = useSettings();
  const { textPrimary, cardBg, border } = getThemeColors(isDark);
  const { width } = useWindowDimensions();
  const isVeryWide = width >= 2800;
  const isWide = width >= 2200 && width < 2800;

  const styles = StyleSheet.create({
    filterChip: {
      backgroundColor: cardBg,
      paddingVertical: isVeryWide ? 8 : isWide ? 6 : 6,
      paddingHorizontal: isVeryWide ? 16 : isWide ? 14 : 12,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: border,
      margin: 2,
      marginRight: 8,
      marginBottom: 4,
    },
    filterChipText: {
      color: textPrimary,
      fontSize: 14,
      fontWeight: '600',
    },
    filterChipTextSelected: {
      color: '#fff',
    },
    filterChipFocused: {
      backgroundColor: isDark ? colorPrimaryDark : colorPrimaryTint,
      borderColor: colorPrimary,
      transform: [{ scale: focusScale }],
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 2,
    },
    filterChipSelected: {
      backgroundColor: colorPrimary,
      borderColor: colorPrimary,
    },
  });

  return (
    <SpatialNavigationFocusableView onSelect={onPress}>
      {({ isFocused }) => (
        <Pressable
          style={[
            styles.filterChip,
            isFocused && styles.filterChipFocused,
            selected && styles.filterChipSelected,
          ]}
          focusable
          accessibilityRole="button"
          accessibilityLabel={`Filter ${label}${selected ? ' selected' : ''}`}
          onPress={onPress}
        >
          <Text
            style={[
              styles.filterChipText,
              selected && styles.filterChipTextSelected,
            ]}
          >
            {label}
          </Text>
        </Pressable>
      )}
    </SpatialNavigationFocusableView>
  );
};

export default memo(FilterChip);
