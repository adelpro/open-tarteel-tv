import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { getThemeColors } from '../constants/theme';
import { useSettings } from '../context/settings.context';

export default function PrivacyScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const { isDark } = useSettings();
  const { textPrimary, textSecondary, border, cardBg } = getThemeColors(isDark);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: cardBg,
    },
    content: {
      padding: 40,
    },
    title: {
      fontSize: 36,
      fontWeight: 'bold',
      color: textPrimary,
      marginBottom: 30,
      textAlign: isRTL ? 'right' : 'left',
    },
    section: {
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: textPrimary,
      marginBottom: 15,
      textAlign: isRTL ? 'right' : 'left',
    },
    text: {
      fontSize: 16,
      color: textPrimary,
      marginBottom: 10,
      lineHeight: 24,
      textAlign: isRTL ? 'right' : 'left',
    },
    linkText: {
      fontSize: 16,
      color: textPrimary,
      marginTop: 10,
      textAlign: isRTL ? 'right' : 'left',
    },
    footer: {
      marginTop: 30,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: border,
    },
    footerText: {
      fontSize: 14,
      color: textSecondary,
      textAlign: isRTL ? 'right' : 'left',
    },
  });
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('privacy.title')}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('privacy.info_collection_title')}
          </Text>
          <Text style={styles.text}>{t('privacy.info_collection_desc')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('privacy.data_usage_title')}
          </Text>
          <Text style={styles.text}>{t('privacy.data_usage_desc')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('privacy.third_party_title')}
          </Text>
          <Text style={styles.text}>{t('privacy.third_party_desc')}</Text>
          <Text style={styles.text}>{t('privacy.mp3_quran_api')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('privacy.contact_title')}</Text>
          <Text style={styles.text}>{t('privacy.contact_desc')}</Text>
          <Text style={styles.linkText}>contact@quran.us.kg</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('privacy.last_updated')}</Text>
        </View>
      </View>
    </ScrollView>
  );
}
