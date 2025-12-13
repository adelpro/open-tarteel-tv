import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

export default function PrivacyScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Privacy Policy</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Information Collection</Text>
          <Text style={styles.text}>
            Open Tarteel TV does not collect, store, or transmit any personal
            information. All audio content is streamed directly from third-party
            sources.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Usage</Text>
          <Text style={styles.text}>
            The app uses internet connectivity solely to stream Quran audio from
            mp3quran.net API. No user data is collected or shared.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Third-Party Services</Text>
          <Text style={styles.text}>
            This app uses the following third-party services:
          </Text>
          <Text style={styles.text}>
            • mp3quran.net API for audio streaming
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <Text style={styles.text}>
            For questions or concerns about this privacy policy, please contact:
          </Text>
          <Text style={styles.linkText}>contact@quran.us.kg</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Last updated: December 2025</Text>
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
  linkText: {
    fontSize: 16,
    color: "#4CAF50",
    marginTop: 10,
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  footerText: {
    fontSize: 14,
    color: "#888",
  },
});
