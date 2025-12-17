import React from "react";
import { Pressable, Text, View } from "react-native";
import { SpatialNavigationFocusableView } from "react-tv-space-navigation";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

type LanguageSwitchProps = {
  styles: {
    menuButton: any;
    menuButtonFocused: any;
    menuButtonText: any;
    menuButtonContent: any;
  };
  isDark: boolean;
};

const LanguageSwitch = ({ styles, isDark }: LanguageSwitchProps) => {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "en" ? "ar" : "en");
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
