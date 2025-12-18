import React, { memo } from "react";
import {
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SpatialNavigationFocusableView } from "react-tv-space-navigation";
import { getThemeColors } from "../constants/theme";
import {
  colorPrimaryGreen,
  colorPrimaryGreenDark,
  colorPrimaryGreenLight,
  focusScale,
} from "../constants/interaction-colors";
import { isRTL } from "../i18n";

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
} & Omit<PressableProps, "onPress">;

const MenuButton = ({
  label,
  iconName,
  onPress,
  isDark,
  ...pressableProps
}: MenuButtonProps) => {
  const { bg, textPrimary, cardBg, border, focusBg } = getThemeColors(isDark);

  const styles = StyleSheet.create({
    menuRow: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "center",
      gap: 12,
      marginBottom: 10,
    },
    menuButton: {
      backgroundColor: cardBg,
      height: 50,
      width: 120,
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: border,
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    menuButtonFocused: {
      backgroundColor: isDark ? colorPrimaryGreenDark : colorPrimaryGreenLight,
      borderColor: colorPrimaryGreen,
      transform: [{ scale: focusScale }],
    },
    menuButtonText: {
      color: textPrimary,
      fontSize: 16,
      fontWeight: "600",
    },
    menuButtonContent: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      gap: 8,
    },
    micButton: {
      width: 42,
      height: 42,
      borderRadius: 8,
      backgroundColor: cardBg,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: border,
    },
    micButtonFocused: {
      backgroundColor: focusBg,
      borderColor: colorPrimaryGreen,
      transform: [{ scale: focusScale }],
    },
  });

  return (
    <SpatialNavigationFocusableView onSelect={onPress}>
      {({ isFocused }) => (
        <Pressable
          style={[styles.menuButton, isFocused && styles.menuButtonFocused]}
          focusable
          {...pressableProps}
        >
          <View style={[styles.menuButtonContent]}>
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
};

export default memo(MenuButton);
