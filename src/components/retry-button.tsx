import React, { memo } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SpatialNavigationFocusableView } from "react-tv-space-navigation";
import { useTranslation } from "react-i18next";
import { colorPrimaryGreen } from "../constants/interaction-colors";

type RetryButtonProps = {
  onPress: () => void;
};

const RetryButton = ({ onPress }: RetryButtonProps) => {
  const { t } = useTranslation();

  const styles = StyleSheet.create({
    retryButton: {
      backgroundColor: colorPrimaryGreen,
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 2,
      borderColor: colorPrimaryGreen,
    },
    retryButtonFocused: {
      backgroundColor: "#45a049",
      borderColor: "#fff",
      transform: [{ scale: 1.08 }],
    },
    retryButtonIcon: {
      marginRight: 10,
    },
    retryButtonText: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "600",
    },
    retryButtonTextFocused: {
      color: "#fff",
    },
  });
  return (
    <SpatialNavigationFocusableView onSelect={onPress}>
      {({ isFocused }) => (
        <Pressable
          style={[styles.retryButton, isFocused && styles.retryButtonFocused]}
          focusable
          hasTVPreferredFocus
          accessibilityRole="button"
          accessibilityLabel="Retry loading reciters"
          onPress={onPress}
        >
          <Ionicons
            name="refresh"
            size={20}
            color={isFocused ? "#fff" : "#4CAF50"}
            style={styles.retryButtonIcon}
          />
          <Text
            style={[
              styles.retryButtonText,
              isFocused && styles.retryButtonTextFocused,
            ]}
          >
            {t("Try_Again")}
          </Text>
        </Pressable>
      )}
    </SpatialNavigationFocusableView>
  );
};

export default memo(RetryButton);
