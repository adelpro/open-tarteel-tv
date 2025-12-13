import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

export default function AboutScreen() {
  const currentYear = new Date().getFullYear();
  const version = "1.0.0"; // Match this with package.json

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
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
    color: "#AAA",
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
  },
  text: {
    fontSize: 16,
    color: "#DDD",
    marginBottom: 10,
    lineHeight: 24,
  },
  footer: {
    marginTop: 50,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  footerText: {
    fontSize: 14,
    color: "#888",
    marginBottom: 5,
  },
});
