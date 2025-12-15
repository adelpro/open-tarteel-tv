import React, { memo } from "react";
import { Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SpatialNavigationFocusableView } from "react-tv-space-navigation";

type RetryButtonProps = {
  onPress: () => void;
  styles: {
    retryButton: any;
    retryButtonFocused: any;
    retryButtonIcon: any;
    retryButtonText: any;
    retryButtonTextFocused: any;
  };
};

const RetryButton = ({ onPress, styles }: RetryButtonProps) => (
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
          Try Again
        </Text>
      </Pressable>
    )}
  </SpatialNavigationFocusableView>
);

export default memo(RetryButton);

