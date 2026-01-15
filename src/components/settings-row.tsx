import React, { memo } from "react";
import { StyleSheet, Text, View, Switch, Pressable } from "react-native";
import { SpatialNavigationFocusableView } from "react-tv-space-navigation";
import { getThemeColors } from "../constants/theme";
import {
  colorPrimary,
  colorPrimaryDark,
  colorPrimaryLight,
  focusScale,
} from "../constants/interaction-colors";

type SettingRowProps = {
  label: string;
  isEnabled: boolean;
  onToggle: () => void;
  isDark: boolean;
};

export const SettingRow = memo(
  ({ label, isEnabled, onToggle, isDark }: SettingRowProps) => {
    const { textPrimary, cardBg, border } = getThemeColors(isDark);

    const styles = StyleSheet.create({
      row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: cardBg,
        padding: 15,
        paddingHorizontal: 20,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: "transparent",
        marginBottom: 10,
        // Add a minHeight to ensure it's easily focusable/clickable
        minHeight: 60,
      },
      rowFocused: {
        backgroundColor: isDark ? colorPrimaryDark : colorPrimaryLight,
        borderColor: colorPrimary,
        transform: [{ scale: focusScale }],
      },
      label: {
        color: textPrimary,
        fontSize: 18,
        fontWeight: "500",
      },
    });

    return (
      <SpatialNavigationFocusableView onSelect={onToggle}>
        {({ isFocused }) => (
          <Pressable
            style={[styles.row, isFocused && styles.rowFocused]}
            onPress={onToggle}
          >
            <Text style={styles.label}>{label}</Text>
            <Switch
              value={isEnabled}
              onValueChange={onToggle}
              trackColor={{ false: "#767577", true: colorPrimary }}
              thumbColor={isEnabled ? "#fff" : "#f4f3f4"}
              // Disable standard focus for switch since the parent handles it
              focusable={false}
            />
          </Pressable>
        )}
      </SpatialNavigationFocusableView>
    );
  },
);
