import React, { useCallback, useMemo } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import EmptyState from './empty-state';
import SearchInput from './search-input';
import SectionFeatured from './section-featured';
import SectionFilters from './section-filters';
import SectionLetterFilter from './section-letter-filter';
import { Reciter, Riwaya } from '../types';
import { normalizeHeaderHeight } from '../utils/home-header';

type HomeHeaderProps = {
  searchQuery: string;
  onSearchQueryChange: (text: string) => void;
  onSearchFocusChange: (focused: boolean) => void;
  isDark: boolean;

  selectedRiwaya: Riwaya | 'all';
  onSelectRiwaya: (riwaya: Riwaya | 'all') => void;
  isRTL: boolean;

  letters: string[];
  selectedLetter: string;
  onSelectLetter: (letter: string) => void;

  recentlyPlayedReciters: Reciter[];
  myFavoritedReciters: Reciter[];
  mostViewedReciters: Reciter[];
  mostFavoritedReciters: Reciter[];
  itemWidth: number;
  viewCounts: Record<string, number>;
  favoriteCounts: Record<string, number>;
  onReciterPress: (reciter: Reciter) => void;
  isVeryWide: boolean;
  isWide: boolean;
  textPrimary: string;

  reciterCount: number;
  onHeight: (height: number) => void;
};

function createStyles(
  textPrimary: string,
  isVeryWide: boolean,
  isWide: boolean,
) {
  return StyleSheet.create({
    recitersTitleContainer: {
      marginTop: 20,
    },
    recitersTitle: {
      color: textPrimary,
      fontSize: isVeryWide ? 28 : isWide ? 24 : 20,
      fontWeight: '700',
      marginBottom: 12,
      paddingHorizontal: 20,
    },
  });
}

/**
 * The scrollable, non-grid part of the Home screen: search, filters, featured
 * rails and the Reciters title (or its empty state). Reports its own measured
 * height so a virtualized grid can size itself to the remaining viewport.
 */
export default function HomeHeader({
  searchQuery,
  onSearchQueryChange,
  onSearchFocusChange,
  isDark,
  selectedRiwaya,
  onSelectRiwaya,
  isRTL,
  letters,
  selectedLetter,
  onSelectLetter,
  recentlyPlayedReciters,
  myFavoritedReciters,
  mostViewedReciters,
  mostFavoritedReciters,
  itemWidth,
  viewCounts,
  favoriteCounts,
  onReciterPress,
  isVeryWide,
  isWide,
  textPrimary,
  reciterCount,
  onHeight,
}: HomeHeaderProps) {
  const { t } = useTranslation();

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      onHeight(normalizeHeaderHeight(event.nativeEvent.layout.height));
    },
    [onHeight],
  );

  const styles = useMemo(
    () => createStyles(textPrimary, isVeryWide, isWide),
    [textPrimary, isVeryWide, isWide],
  );

  return (
    <View onLayout={handleLayout}>
      <SearchInput
        value={searchQuery}
        onChangeText={onSearchQueryChange}
        onFocusChange={onSearchFocusChange}
        isDark={isDark}
      />

      <SectionFilters
        selectedRiwaya={selectedRiwaya}
        onSelectRiwaya={onSelectRiwaya}
        isRTL={isRTL}
      />

      <SectionLetterFilter
        letters={letters}
        selectedLetter={selectedLetter}
        onSelectLetter={onSelectLetter}
        isRTL={isRTL}
      />

      {recentlyPlayedReciters.length > 0 && (
        <SectionFeatured
          title={`${t('recently_played')} (${recentlyPlayedReciters.length})`}
          reciters={recentlyPlayedReciters}
          itemWidth={itemWidth}
          isRTL={isRTL}
          viewCounts={viewCounts}
          favoriteCounts={favoriteCounts}
          onReciterPress={onReciterPress}
          isVeryWide={isVeryWide}
          isWide={isWide}
          textPrimary={textPrimary}
        />
      )}

      <SectionFeatured
        title={`${t('my_favorites')} (${myFavoritedReciters.length})`}
        reciters={myFavoritedReciters}
        itemWidth={itemWidth}
        isRTL={isRTL}
        viewCounts={viewCounts}
        favoriteCounts={favoriteCounts}
        onReciterPress={onReciterPress}
        isVeryWide={isVeryWide}
        isWide={isWide}
        textPrimary={textPrimary}
      />

      <SectionFeatured
        title={`${t('most_viewed')} (${mostViewedReciters.length})`}
        reciters={mostViewedReciters}
        itemWidth={itemWidth}
        isRTL={isRTL}
        viewCounts={viewCounts}
        favoriteCounts={favoriteCounts}
        onReciterPress={onReciterPress}
        isVeryWide={isVeryWide}
        isWide={isWide}
        textPrimary={textPrimary}
      />

      <SectionFeatured
        title={`${t('most_favorited')} (${mostFavoritedReciters.length})`}
        reciters={mostFavoritedReciters}
        itemWidth={itemWidth}
        isRTL={isRTL}
        viewCounts={viewCounts}
        favoriteCounts={favoriteCounts}
        onReciterPress={onReciterPress}
        isVeryWide={isVeryWide}
        isWide={isWide}
        textPrimary={textPrimary}
      />

      {reciterCount > 0 ? (
        <View style={styles.recitersTitleContainer}>
          <Text style={styles.recitersTitle}>
            {t('reciters')} ({reciterCount})
          </Text>
        </View>
      ) : (
        <EmptyState
          icon="search-outline"
          title={t('No_Search_Results_Title')}
          message={t('No_Search_Results_Content')}
        />
      )}
    </View>
  );
}
