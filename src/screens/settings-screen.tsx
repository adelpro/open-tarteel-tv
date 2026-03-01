import React from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

import { useTranslation } from 'react-i18next';
import {
  SpatialNavigationScrollView,
  SpatialNavigationView,
} from 'react-tv-space-navigation';

import BrandHeader from '../components/brand-header';
import { SettingRow } from '../components/settings-row';
import { getThemeColors } from '../constants/theme';
import { useSettings } from '../context/settings.context';
import { LinkSource } from '../types';

const SettingsScreen = () => {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== 'light';
  const { bg, textPrimary, textSecondary } = getThemeColors(isDark);
  const { isSourceEnabled, toggleSource } = useSettings();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: bg,
      padding: 20,
    },
    title: {
      color: textPrimary,
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
    },
    section: {
      marginBottom: 30,
      padding: 50,
    },
    sectionTitle: {
      color: textSecondary,
      fontSize: 18,
      marginBottom: 10,
      textTransform: 'uppercase',
    },
  });

  const sources = Object.values(LinkSource);

  return (
    <View style={styles.container}>
      <BrandHeader />
      <SpatialNavigationScrollView>
        <SpatialNavigationView direction="vertical">
          <Text style={styles.title}>{t('settings')}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('sources_management')}</Text>
            {sources.map((source) => (
              <SettingRow
                key={source}
                label={t(`source_${source}`)}
                isEnabled={isSourceEnabled(source)}
                onToggle={() => toggleSource(source)}
                isDark={isDark}
              />
            ))}
          </View>
        </SpatialNavigationView>
      </SpatialNavigationScrollView>
    </View>
  );
};

export default SettingsScreen;
