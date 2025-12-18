import React, { useEffect, useState } from "react";
import {
  Pressable,
  Text,
  View,
  TextStyle,
  ViewStyle,
  PressableProps,
  StyleSheet,
} from "react-native";
import { SpatialNavigationFocusableView } from "react-tv-space-navigation";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import {
  colorPrimaryGreen,
  colorPrimaryGreenDark,
  colorPrimaryGreenLight,
  focusScale,
} from "../constants/interaction-colors";
import { getThemeColors } from "../constants/theme";

type LanguageSwitchProps = {
  isDark: boolean;
} & Omit<PressableProps, "onPress">;

const LANGUAGE_KEY = "app_language";

const LanguageSwitch = ({ isDark, ...pressableProps }: LanguageSwitchProps) => {
  const { t, i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language);

  const { textPrimary, cardBg, border, focusBg } = getThemeColors(isDark);

  const isRTL = i18n.dir() === "rtl";

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

  // Load saved language on mount
  useEffect(() => {
    (async () => {
      const savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLang && savedLang !== i18n.language) {
        await i18n.changeLanguage(savedLang);
        setCurrentLang(savedLang);
      }
    })();
  }, []);

  const toggleLanguage = async () => {
    const newLang = currentLang === "en" ? "ar" : "en";
    await i18n.changeLanguage(newLang);
    await AsyncStorage.setItem(LANGUAGE_KEY, newLang);
    setCurrentLang(newLang);
  };

  return (
    <SpatialNavigationFocusableView onSelect={toggleLanguage}>
      {({ isFocused }) => (
        <Pressable
          style={[styles.menuButton, isFocused && styles.menuButtonFocused]}
          focusable
          accessibilityRole="button"
          accessibilityLabel={t("change_language")}
          {...pressableProps}
        >
          <View style={styles.menuButtonContent}>
            <Ionicons
              name="language"
              size={18}
              color={isFocused ? "#4CAF50" : isDark ? "#bbb" : "#666"}
            />
            <Text style={styles.menuButtonText}>{t("change_language")}</Text>
          </View>
        </Pressable>
      )}
    </SpatialNavigationFocusableView>
  );
};

export default LanguageSwitch;
