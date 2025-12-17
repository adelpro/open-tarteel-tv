import React, { useEffect, useState } from "react";
import { Pressable, Text, View, TextStyle, ViewStyle } from "react-native";
import { SpatialNavigationFocusableView } from "react-tv-space-navigation";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

type LanguageSwitchProps = {
  styles: {
    menuButton: ViewStyle;
    menuButtonFocused: ViewStyle;
    menuButtonText: TextStyle;
    menuButtonContent: TextStyle;
  };
  isDark: boolean;
};

const LANGUAGE_KEY = "app_language";

const LanguageSwitch = ({ styles, isDark }: LanguageSwitchProps) => {
  const { t, i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language);

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
