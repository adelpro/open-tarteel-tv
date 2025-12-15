import React, { memo } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SpatialNavigationFocusableView } from "react-tv-space-navigation";

type MenuButtonProps = {
  label: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  styles: {
    menuButton: any;
    menuButtonFocused: any;
    menuButtonText: any;
    menuButtonContent: any;
  };
  isDark: boolean;
};

const MenuButton = ({
  label,
  iconName,
  onPress,
  styles,
  isDark,
}: MenuButtonProps) => (
  <SpatialNavigationFocusableView onSelect={onPress}>
    {({ isFocused }) => (
      <Pressable
        style={[styles.menuButton, isFocused && styles.menuButtonFocused]}
        focusable
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <View style={styles.menuButtonContent}>
          {iconName ? (
            <Ionicons
              name={iconName}
              size={18}
              color={isFocused ? "#4CAF50" : isDark ? "#bbb" : "#666"}
            />
          ) : null}
          <Text style={styles.menuButtonText}>{label}</Text>
        </View>
      </Pressable>
    )}
  </SpatialNavigationFocusableView>
);

export default memo(MenuButton);

