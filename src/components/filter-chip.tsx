import React, { memo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import { SpatialNavigationFocusableView } from "react-tv-space-navigation";
import { getThemeColors } from "../constants/theme";
import {
  colorPrimaryGreen,
  colorPrimaryGreenDark,
  colorPrimaryGreenTint,
  focusScale,
} from "../constants/interaction-colors";

type FilterChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

const FilterChip = ({ label, selected, onPress }: FilterChipProps) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const { textPrimary, cardBg, border } = getThemeColors(isDark);
  const { width } = useWindowDimensions();
  const isVeryWide = width >= 2800;
  const isWide = width >= 2200 && width < 2800;

  const styles = StyleSheet.create({
    filterChip: {
      backgroundColor: cardBg,
      paddingVertical: isVeryWide ? 12 : isWide ? 10 : 10,
      paddingHorizontal: isVeryWide ? 20 : isWide ? 18 : 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: border,
      margin: 4,
      marginRight: 12,
      marginBottom: 12,
    },
    filterChipText: {
      color: textPrimary,
      fontSize: 14,
      fontWeight: "600",
    },
    filterChipTextSelected: {
      color: "#fff",
    },
    filterChipFocused: {
      backgroundColor: isDark ? colorPrimaryGreenDark : colorPrimaryGreenTint,
      borderColor: colorPrimaryGreen,
      transform: [{ scale: focusScale }],
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 2,
    },
    filterChipSelected: {
      backgroundColor: colorPrimaryGreen,
      borderColor: colorPrimaryGreen,
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
          accessibilityLabel={`Filter ${label}${selected ? " selected" : ""}`}
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
