import React, { memo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  useColorScheme,
  useWindowDimensions,
  ViewStyle,
} from "react-native";
import { SpatialNavigationFocusableView } from "react-tv-space-navigation";
import { Reciter, Riwaya } from "../types";
import RiwayaTag from "./riwaya-tag";
import { getThemeColors } from "../constants/theme";
import { useTranslation } from "react-i18next";
import {
  colorPrimaryGreen,
  colorPrimaryGreenDark,
  colorPrimaryGreenLight,
  focusScale,
} from "../constants/interaction-colors";

type ReciterCardProps = {
  reciter: Reciter;
  preferredFocus: boolean;
  onPress: (reciter: Reciter) => void;
};

const RIWAYA_LABEL: Record<Riwaya, string> = {
  [Riwaya.HAFS_A_ASIM]: "Hafs",
  [Riwaya.WARSH_AN_NAFI]: "Warsh",
  [Riwaya.QALUN_AN_NAFI]: "Qalun",
  [Riwaya.ALDURI_AN_ALKAISSAI]: "Ad-Duri",
};

const ReciterCard = ({
  reciter,
  preferredFocus,
  onPress,
}: ReciterCardProps) => {
  const { i18n } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const { textPrimary, textSecondary, cardBg, border, focusBg } =
    getThemeColors(isDark);
  const { width } = useWindowDimensions();
  const isRTL = i18n.dir() === "rtl";
  const isVeryWide = width >= 2800;
  const isWide = width >= 2200 && width < 2800;
  const isMedium = width >= 1600 && width < 2200;
  const styles = StyleSheet.create({
    reciterCard: {
      height: isVeryWide ? 140 : isWide ? 128 : isMedium ? 118 : 110,
      backgroundColor: cardBg,
      paddingVertical: isVeryWide ? 28 : isWide ? 24 : 20,
      paddingHorizontal: isVeryWide ? 24 : isWide ? 20 : 16,
      margin: 2,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: border,
    },
    reciterCardFocused: {
      backgroundColor: isDark ? colorPrimaryGreenDark : colorPrimaryGreenLight,
      borderColor: colorPrimaryGreen,
      transform: [{ scale: focusScale }],
      zIndex: 2,
    },
    reciterName: {
      fontSize: isVeryWide ? 26 : isWide ? 24 : isMedium ? 20 : 18,
      fontWeight: "bold",
      color: textPrimary,
      marginBottom: 5,
      textAlign: isRTL ? "right" : "left",
    },
    reciterDesc: {
      fontSize: isVeryWide ? 18 : isWide ? 16 : isMedium ? 15 : 14,
      color: textSecondary,
      textAlign: isRTL ? "right" : "left",
    },
  });
  return (
    <SpatialNavigationFocusableView onSelect={() => onPress(reciter)}>
      {({ isFocused }) => (
        <Pressable
          style={[styles.reciterCard, isFocused && styles.reciterCardFocused]}
          focusable
          hasTVPreferredFocus={preferredFocus}
          accessibilityRole="button"
          accessibilityLabel={`Reciter ${reciter.name}, Moshaf ${reciter.moshaf.name}`}
        >
          <Text
            style={styles.reciterName}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {reciter.name}
          </Text>
          <Text
            style={styles.reciterDesc}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {reciter.moshaf.name} • {RIWAYA_LABEL[reciter.moshaf.riwaya]}
          </Text>
          <RiwayaTag riwaya={reciter.moshaf.riwaya} />
        </Pressable>
      )}
    </SpatialNavigationFocusableView>
  );
};

export default memo(ReciterCard);
