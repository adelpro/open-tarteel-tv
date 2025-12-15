import React, { memo } from "react";
import { Pressable, Text } from "react-native";
import { SpatialNavigationFocusableView } from "react-tv-space-navigation";

type FilterChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  styles: {
    filterChip: any;
    filterChipFocused: any;
    filterChipSelected: any;
    filterChipText: any;
    filterChipTextSelected: any;
  };
};

const FilterChip = ({ label, selected, onPress, styles }: FilterChipProps) => (
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

export default memo(FilterChip);

