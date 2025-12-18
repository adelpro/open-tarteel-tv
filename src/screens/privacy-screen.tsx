import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
} from "react-native";
import { useTranslation } from "react-i18next";

export default function PrivacyScreen() {
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const isRtl = i18n.dir() === "rtl";
  const styles = createStyles(isDark, isRtl);
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t("privacy.title")}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("privacy.info_collection_title")}
          </Text>
          <Text style={styles.text}>{t("privacy.info_collection_desc")}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("privacy.data_usage_title")}
          </Text>
          <Text style={styles.text}>{t("privacy.data_usage_desc")}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("privacy.third_party_title")}
          </Text>
          <Text style={styles.text}>{t("privacy.third_party_desc")}</Text>
          <Text style={styles.text}>{t("privacy.mp3_quran_api")}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("privacy.contact_title")}</Text>
          <Text style={styles.text}>{t("privacy.contact_desc")}</Text>
          <Text style={styles.linkText}>contact@quran.us.kg</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t("privacy.last_updated")}</Text>
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
    linkText: {
      fontSize: 16,
      color: "#4CAF50",
      marginTop: 10,
      textAlign,
    },
    footer: {
      marginTop: 30,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: border,
    },
    footerText: {
      fontSize: 14,
      color: isDark ? "#888" : "#666",
      textAlign,
    },
  });
}
