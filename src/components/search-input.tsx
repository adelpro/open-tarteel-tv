import React, { memo, useMemo, useRef, useState } from 'react';
import { StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SpatialNavigationFocusableView } from 'react-tv-space-navigation';

import {
  colorPrimary,
  colorPrimaryDark,
  colorPrimaryLight,
  colorPrimaryTint,
  focusScale,
} from '../constants/interaction-colors';
import { getThemeColors } from '../constants/theme';

type SearchInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  onFocusChange?: (focused: boolean) => void;
  isDark: boolean;
};

/** Focusable search input with TV remote navigation support. */
const SearchInput = ({
  value,
  onChangeText,
  onFocusChange,
  isDark,
}: SearchInputProps) => {
  const inputRef = useRef<TextInput>(null);
  const [textFocused, setTextFocused] = useState(false);
  const { t } = useTranslation();

  const width = useWindowDimensions().width;

  const isVeryWide = width >= 2800;
  const isWide = width >= 2200;

  const { cardBg, textPrimary, border } = getThemeColors(isDark);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        searchContainer: {
          marginBottom: 16,
          alignItems: 'center',
          paddingHorizontal: 20,
          width: '100%',
        },
        searchInput: {
          backgroundColor: cardBg,
          color: textPrimary,
          flex: 1,
          paddingVertical: isVeryWide ? 16 : isWide ? 14 : 12,
          paddingHorizontal: isVeryWide ? 16 : isWide ? 14 : 12,
          borderRadius: 8,
          fontSize: 16,
        },
        searchInputContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: cardBg,
          borderRadius: 8,
          borderWidth: 2,
          borderColor: border,
          paddingHorizontal: 8,
          width: `${100 / focusScale}%`,
          marginBottom: 16,
          alignSelf: 'center',
        },
        searchInputIcon: {
          marginLeft: 10,
        },
        searchInputFocused: {
          backgroundColor: isDark ? colorPrimaryDark : colorPrimaryTint,
          borderColor: colorPrimary,
          borderWidth: 3,
          marginVertical: 4,
          transform: [{ scale: focusScale }],
        },
      }),
    [isDark, isVeryWide, isWide, cardBg, textPrimary, border],
  );

  return (
    <SpatialNavigationFocusableView
      onSelect={() => {
        inputRef.current?.focus();
      }}
    >
      {({ isFocused }) => (
        <View
          style={[
            styles.searchInputContainer,
            (textFocused || isFocused) && styles.searchInputFocused,
          ]}
        >
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => {
              setTextFocused(true);
              onFocusChange?.(true);
            }}
            onBlur={() => {
              setTextFocused(false);
              onFocusChange?.(false);
            }}
            showSoftInputOnFocus
            placeholder={t('search_placeholder')}
            placeholderTextColor={isDark ? '#888' : '#999'}
          />

          <Ionicons
            name="search"
            size={20}
            color={
              textFocused || isFocused
                ? colorPrimary
                : isDark
                  ? colorPrimaryLight
                  : colorPrimaryDark
            }
            style={styles.searchInputIcon}
          />
        </View>
      )}
    </SpatialNavigationFocusableView>
  );
};

export default memo(SearchInput);
