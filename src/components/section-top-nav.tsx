import React from "react";
import { StyleSheet, View } from "react-native";
import { SpatialNavigationView } from "react-tv-space-navigation";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import MenuButton from "./menu-button";
import LanguageSwitch from "./language-switch";

type TopNavigationProps = {
  isRTL: boolean;
  isDark: boolean;
};

const SectionTopNav = ({ isRTL, isDark }: TopNavigationProps) => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();

  const styles = StyleSheet.create({
    menuRow: {
      flexDirection: "row",
      justifyContent: isRTL ? "flex-start" : "flex-end",
      gap: 10,
      marginBottom: 20,
    },
  });

  const buttons = [
    <MenuButton
      key="about"
      label={t("About")}
      iconName="information-circle-outline"
      onPress={() => navigation.navigate("About")}
      isDark={isDark}
      accessibilityLabel={t("About")}
      accessibilityRole="button"
    />,
    <MenuButton
      key="privacy"
      label={t("Privacy")}
      iconName="shield-checkmark-outline"
      onPress={() => navigation.navigate("Privacy")}
      isDark={isDark}
      accessibilityLabel={t("Privacy")}
      accessibilityRole="button"
    />,
    <LanguageSwitch
      key="lang"
      isDark={isDark}
      accessibilityLabel={t("change_language")}
      accessibilityRole="button"
    />,
  ];

  return (
    <View>
      <SpatialNavigationView direction="horizontal" style={styles.menuRow}>
        {isRTL ? [...buttons].reverse() : buttons}
      </SpatialNavigationView>
    </View>
  );
};

export default SectionTopNav;
