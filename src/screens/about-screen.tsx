import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
} from "react-native";
import { version } from "../../package.json";

export default function AboutScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  const styles = createStyles(isDark);
  const currentYear = new Date().getFullYear();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Open Tarteel TV</Text>
        <Text style={styles.description}>
          Quran streaming application for TV devices
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <Text style={styles.text}>
            • TV-optimized interface with remote control support
          </Text>
          <Text style={styles.text}>• Multiple renowned reciters</Text>
          <Text style={styles.text}>• High-quality audio streaming</Text>
          <Text style={styles.text}>• All 114 Surahs available</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.text}>
            Open Tarteel TV is a React Native application built with Expo to
            provide an optimal Quran audio streaming experience on TV platforms.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © {currentYear} v{version}
          </Text>
          <Text style={styles.footerText}>Created by adelpro</Text>
          <Text style={styles.footerText}>
            Source: github.com/adelpro/open-tarteel-tv
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function createStyles(isDark: boolean) {
  const bg = isDark ? "#121212" : "#FFFFFF";
  const textPrimary = isDark ? "#fff" : "#111";
  const textSecondary = isDark ? "#AAA" : "#555";
  const border = isDark ? "#333" : "#E0E0E0";
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
    },
    description: {
      fontSize: 18,
      color: textSecondary,
      marginBottom: 30,
    },
    section: {
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: textPrimary,
      marginBottom: 15,
    },
    text: {
      fontSize: 16,
      color: isDark ? "#DDD" : "#333",
      marginBottom: 10,
      lineHeight: 24,
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
    },
  });
}
