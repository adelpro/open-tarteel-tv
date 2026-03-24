import React, { useEffect, useRef } from 'react';
import { I18nManager, StyleSheet, Text, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  SpatialNavigationFocusableView,
  SpatialNavigationView,
} from 'react-tv-space-navigation';

import BrandHeader from '../components/brand-header';
import { SettingRow } from '../components/settings-row';
import {
  colorPrimary,
  colorPrimaryDark,
  colorPrimaryLight,
  focusScale,
} from '../constants/interaction-colors';
import { getThemeColors } from '../constants/theme';
import { ThemeMode, useSettings } from '../context/settings.context';
import { LinkSource } from '../types';

type SpatialRef = { focus: () => void };

const THEME_OPTIONS: { key: ThemeMode; labelKey: string }[] = [
  { key: 'system', labelKey: 'theme_system' },
  { key: 'light', labelKey: 'theme_light' },
  { key: 'dark', labelKey: 'theme_dark' },
];

const SettingsScreen = () => {
  const { t } = useTranslation();
  const isFocused = useIsFocused();
  const firstItemRef = useRef<SpatialRef | null>(null);
  const {
    isSourceEnabled,
    toggleSource,
    isDark,
    themeMode,
    setThemeMode,
    keepScreenAwake,
    toggleKeepScreenAwake,
  } = useSettings();
  const { bg, textPrimary, textSecondary, cardBg } = getThemeColors(isDark);
  const isRTL = I18nManager.isRTL;

  // When this screen becomes active, steal focus from whatever was focused before
  useEffect(() => {
    if (isFocused) {
      const timer = setTimeout(() => {
        firstItemRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isFocused]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: bg,
      padding: 20,
      paddingHorizontal: 40,
    },
    title: {
      color: textPrimary,
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
    },
    rowContainer: {
      flex: 1,
      // For RTL spatial engine geometric calculations to be correct with flipped TV hardware events,
      // we must lay out physically LTR and flip visually to RTL using scaleX.
      flexDirection: 'row',
      transform: isRTL ? [{ scaleX: -1 }] : [],
    },
    column: {
      flex: 1,
      paddingRight: isRTL ? 0 : 40,
      paddingLeft: isRTL ? 40 : 0,
      // Counter scale to undo the text/content mirroring
      transform: isRTL ? [{ scaleX: -1 }] : [],
    },
    lastColumn: {
      flex: 1,
      transform: isRTL ? [{ scaleX: -1 }] : [],
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      color: textSecondary,
      fontSize: 18,
      marginBottom: 12,
      textTransform: 'uppercase',
      textAlign: 'left',
    },
    themeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: cardBg,
      padding: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: 'transparent',
      marginBottom: 10,
      minHeight: 50,
    },
    themeRowFocused: {
      backgroundColor: isDark ? colorPrimaryDark : colorPrimaryLight,
      borderColor: colorPrimary,
      transform: [{ scale: focusScale }],
    },
    themeRowSelected: {
      borderColor: colorPrimary,
    },
    themeRowLabel: {
      color: textPrimary,
      fontSize: 18,
      fontWeight: '500',
    },
  });

  const sources = Object.values(LinkSource);

  return (
    <View style={styles.container}>
      <BrandHeader />
      <Text style={styles.title}>{t('settings')}</Text>

      <SpatialNavigationView direction="horizontal" style={styles.rowContainer}>
        {/* Column 1: Appearance */}
        <SpatialNavigationView direction="vertical" style={styles.column}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('theme_appearance')}</Text>
            {THEME_OPTIONS.map(({ key, labelKey }, index) => (
              <SpatialNavigationFocusableView
                key={key}
                ref={index === 0 ? firstItemRef : undefined}
                onSelect={() => setThemeMode(key)}
              >
                {({ isFocused }) => (
                  <View
                    style={[
                      styles.themeRow,
                      isFocused && styles.themeRowFocused,
                      themeMode === key && styles.themeRowSelected,
                    ]}
                  >
                    <Text style={styles.themeRowLabel}>{t(labelKey)}</Text>
                    {themeMode === key && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={colorPrimary}
                      />
                    )}
                  </View>
                )}
              </SpatialNavigationFocusableView>
            ))}
          </View>
        </SpatialNavigationView>

        {/* Column 2: Sources & Playback */}
        <SpatialNavigationView direction="vertical" style={styles.lastColumn}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('playback_settings')}</Text>
            <SettingRow
              label={t('keep_screen_awake')}
              isEnabled={keepScreenAwake}
              onToggle={toggleKeepScreenAwake}
              isDark={isDark}
            />
          </View>

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
      </SpatialNavigationView>
    </View>
  );
};

export default SettingsScreen;
