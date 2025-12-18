import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
} from "react-native";
import { useTranslation } from "react-i18next";
import { version } from "../../package.json";

export default function AboutScreen() {
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const isRtl = i18n.dir() === "rtl";
  const styles = createStyles(isDark, isRtl);
  const currentYear = new Date().getFullYear();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t("about.title")}</Text>
        <Text style={styles.description}>{t("about.description")}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("about.features_title")}</Text>
          <Text style={styles.text}>{t("about.feature_tv")}</Text>
          <Text style={styles.text}>{t("about.feature_reciters")}</Text>
          <Text style={styles.text}>{t("about.feature_audio")}</Text>
          <Text style={styles.text}>{t("about.feature_surahs")}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("about.about_title")}</Text>
          <Text style={styles.text}>{t("about.about_desc")}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © {currentYear} v{version}
          </Text>
          <Text style={styles.footerText}>{t("about.created_by")}</Text>
          <Text style={styles.footerText}>{t("about.source_code")}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function createStyles(isDark: boolean, isRtl: boolean) {
  const bg = isDark ? "#121212" : "#FFFFFF";
  const textPrimary = isDark ? "#fff" : "#111";
  const textSecondary = isDark ? "#AAA" : "#555";
  const border = isDark ? "#333" : "#E0E0E0";
  const textAlign = isRtl ? "right" : "left";

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: bg,
    },
    content: {
      padding: 40,
    },
    title: {
      fontSize: 36,
      fontWeight: "bold",
      color: "#4CAF50",
      marginBottom: 10,
      textAlign,
    },
    description: {
      fontSize: 18,
      color: textSecondary,
      marginBottom: 30,
      textAlign,
    },
    section: {
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: textPrimary,
      marginBottom: 15,
      textAlign,
    },
    text: {
      fontSize: 16,
      color: isDark ? "#DDD" : "#333",
      marginBottom: 10,
      lineHeight: 24,
      textAlign,
    },
    footer: {
      marginTop: 50,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: border,
    },
    footerText: {
      fontSize: 14,
      color: isDark ? "#888" : "#666",
      marginBottom: 5,
      textAlign,
    },
  });
}
