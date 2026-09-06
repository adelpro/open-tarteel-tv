import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { getThemeColors } from '../constants/theme';
import { useSettings } from '../context/settings.context';
import { getAppVersion } from '../utils/app-info';

export default function AboutScreen() {
  const { t, i18n } = useTranslation();
  const { isDark } = useSettings();
  const { textPrimary, textSecondary, border, cardBg } = getThemeColors(isDark);
  const isRtl = i18n.dir() === 'rtl';
  const currentYear = new Date().getFullYear();

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
      marginBottom: 10,
      textAlign: isRtl ? 'right' : 'left',
    },
    description: {
      fontSize: 18,
      color: textSecondary,
      marginBottom: 30,
      textAlign: isRtl ? 'right' : 'left',
    },
    section: {
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: textPrimary,
      marginBottom: 15,
      textAlign: isRtl ? 'right' : 'left',
    },
    text: {
      fontSize: 16,
      color: textSecondary,
      marginBottom: 10,
      lineHeight: 24,
      textAlign: isRtl ? 'right' : 'left',
    },
    footer: {
      marginTop: 50,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: border,
    },
    footerText: {
      fontSize: 14,
      color: textSecondary,
      marginBottom: 5,
      textAlign: isRtl ? 'right' : 'left',
    },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('about.title')}</Text>
        <Text style={styles.description}>{t('about.description')}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('about.features_title')}</Text>
          <Text style={styles.text}>{t('about.feature_tv')}</Text>
          <Text style={styles.text}>{t('about.feature_reciters')}</Text>
          <Text style={styles.text}>{t('about.feature_audio')}</Text>
          <Text style={styles.text}>{t('about.feature_surahs')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('about.about_title')}</Text>
          <Text style={styles.text}>{t('about.about_desc')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('about.sources_title')}</Text>
          <Text style={styles.text}>{t('about.sources_desc')}</Text>
          <Text style={styles.text}>https://www.mp3quran.net/ar/api</Text>
          <Text style={styles.text}>https://api.cms.itqan.dev/docs/</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © {currentYear} v{getAppVersion()}
          </Text>
          <Text style={styles.footerText}>{t('about.created_by')}</Text>
          <Text style={styles.footerText}>{t('about.source_code')}</Text>
        </View>
      </View>
    </ScrollView>
  );
}
