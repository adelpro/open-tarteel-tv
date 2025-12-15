import React from 'react';
import { StyleSheet, Text, View, useColorScheme, Pressable } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { getFlexDirection, getTextAlign } from '../utils/rtl';
import { getThemeColors } from '../constants/theme';

interface LanguageSwitcherProps {
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export default function LanguageSwitcher({ 
  size = 'medium', 
  showLabel = true 
}: LanguageSwitcherProps) {
  const { toggleLanguage, language } = useLanguage();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== 'light';
  const colors = getThemeColors(isDark);

  const styles = createStyles(isDark, colors, size);

  const handleLanguageToggle = async () => {
    await toggleLanguage();
  };

  const getLanguageLabel = () => {
    return language === 'ar' ? 'English' : 'العربية';
  };

  return (
    <Pressable
      onPress={handleLanguageToggle}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
      accessible
      accessibilityLabel={t('common.language')}
      accessibilityRole="button"
    >
      <View style={[styles.content, { flexDirection: getFlexDirection() }]}>
        <Text style={styles.text}>{getLanguageLabel()}</Text>
      </View>
    </Pressable>
  );
}

const createStyles = (isDark: boolean, colors: any, size: string) => {
  const sizeConfig = {
    small: { padding: 8, fontSize: 12 },
    medium: { padding: 12, fontSize: 14 },
    large: { padding: 16, fontSize: 16 },
  }[size] || { padding: 12, fontSize: 14 };

  return StyleSheet.create({
    container: {
      backgroundColor: colors.accent,
      borderRadius: 8,
      paddingHorizontal: sizeConfig.padding,
      paddingVertical: sizeConfig.padding,
      justifyContent: 'center',
      alignItems: 'center',
    },
    pressed: {
      opacity: 0.7,
    },
    content: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    text: {
      color: colors.text,
      fontSize: sizeConfig.fontSize,
      fontWeight: '600',
      textAlign: getTextAlign(),
    },
  });
};
