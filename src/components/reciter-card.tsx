import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";
import { SpatialNavigationFocusableView } from "react-tv-space-navigation";
import { Reciter, Riwaya } from "../types";
import RiwayaTag from "./riwaya-tag";
import { getThemeColors } from "../constants/theme";
import { useTranslation } from "react-i18next";
import {
  colorPrimary,
  colorPrimaryDark,
  colorPrimaryLight,
  focusScale,
} from "../constants/interaction-colors";

import { Ionicons } from "@expo/vector-icons";
import { useItemHeight } from "../hooks/ise-item-height";

type ReciterCardProps = {
  reciter: Reciter;
  preferredFocus: boolean;
  onPress: (reciter: Reciter) => void;
  viewCount?: number;
  favoriteCount?: number;
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
  viewCount,
  favoriteCount,
}: ReciterCardProps) => {
  const { itemHeight } = useItemHeight();
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
      position: "relative",
      direction: isRTL ? "rtl" : "ltr",
      height: itemHeight,
      backgroundColor: cardBg,
      paddingVertical: isVeryWide ? 28 : isWide ? 24 : 20,
      paddingHorizontal: isVeryWide ? 24 : isWide ? 20 : 16,
      margin: 2,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: border,
    },
    reciterCardFocused: {
      backgroundColor: isDark ? colorPrimaryDark : colorPrimaryLight,
      borderColor: colorPrimary,
      transform: [{ scale: focusScale }],
      zIndex: 2,
    },
    reciterName: {
      fontSize: isVeryWide ? 26 : isWide ? 24 : isMedium ? 20 : 18,
      fontWeight: "bold",
      color: textPrimary,
      marginBottom: 5,
      width: "100%",
    },
    reciterDesc: {
      fontSize: isVeryWide ? 18 : isWide ? 16 : isMedium ? 15 : 14,
      color: textSecondary,
      width: "100%",
    },
  });
  return (
    <SpatialNavigationFocusableView onSelect={() => onPress(reciter)}>
      {({ isFocused }) => {
        return (
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
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {reciter.moshaf.name} • {RIWAYA_LABEL[reciter.moshaf.riwaya]}
            </Text>
            <View
              style={{
                flexDirection: "row-reverse",
                alignItems: "center",
                marginTop: 8,
              }}
            >
              {viewCount !== undefined && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Ionicons
                    name="eye-outline"
                    size={14}
                    color={textSecondary}
                  />
                  <Text
                    style={[
                      styles.reciterDesc,
                      { marginEnd: 4, fontSize: 12, width: "auto" },
                    ]}
                  >
                    {viewCount}
                  </Text>
                </View>
              )}

              {favoriteCount !== undefined && (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name="heart-outline"
                    size={14}
                    color={textSecondary}
                  />
                  <Text
                    style={[
                      styles.reciterDesc,
                      { marginEnd: 4, fontSize: 12, width: "auto" },
                    ]}
                  >
                    {favoriteCount}
                  </Text>
                </View>
              )}
            </View>
            <RiwayaTag riwaya={reciter.moshaf.riwaya} />
          </Pressable>
        );
      }}
    </SpatialNavigationFocusableView>
  );
};

export default ReciterCard;
