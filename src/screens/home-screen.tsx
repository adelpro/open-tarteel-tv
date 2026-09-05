import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Fuse from 'fuse.js';
import { useTranslation } from 'react-i18next';
import {
  SpatialNavigationScrollView,
  SpatialNavigationView,
} from 'react-tv-space-navigation';

import BrandHeader from '../components/brand-header';
import EmptyState from '../components/empty-state';
import RetryButton from '../components/retry-button';
import SearchInput from '../components/search-input';
import SectionFeatured from '../components/section-featured';
import SectionFilters from '../components/section-filters';
import SectionLetterFilter from '../components/section-letter-filter';
import SectionRecitersGrid from '../components/section-reciters-grid';
import SectionTopNav from '../components/section-top-nav';
import { colorPrimary } from '../constants/interaction-colors';
import { getThemeColors } from '../constants/theme';
import { useFavorites } from '../context/favorites.context';
import { useRecentlyPlayed } from '../context/recently-played.context';
import { useSettings } from '../context/settings.context';
import { useReciterGridLayout } from '../hooks/use-reciter-grid-layout';
import { useViewCounts } from '../hooks/use-view-counts';
import { fetchRecitersBySource } from '../services/api';
import {
  getCachedRecitersInfo,
  setCachedReciters,
  SOFT_CACHE_TTL_MS,
} from '../services/reciters-cache';
import { Reciter, Riwaya } from '../types';
import { normalizeArabicLetter, normalizeSearchText } from '../utils/search';

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const lang = i18n.language === 'ar' ? 'ar' : 'en';
  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { width } = useWindowDimensions();
  const { viewCounts } = useViewCounts();
  const { favoriteCounts } = useFavorites();
  const { recentlyPlayed } = useRecentlyPlayed();
  const { enabledSources, isDark, cacheEpoch } = useSettings();

  // Read the latest enabled sources without recreating loadReciters on every
  // identity change (SettingsProvider rebuilds the object on mount).
  const enabledSourcesRef = useRef(enabledSources);
  enabledSourcesRef.current = enabledSources;

  // Content-based signature so the load effect only re-fires when the actual
  // set of enabled sources changes, not when the object identity changes.
  const sourcesSignature = useMemo(
    () =>
      Object.keys(enabledSources)
        .sort()
        .map((source) => `${source}:${enabledSources[source] !== false}`)
        .join('|'),
    [enabledSources],
  );

  // Guards against stale responses racing each other (fast language switches,
  // rapid retries) and cancels in-flight HTTP on unmount.
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRiwaya, setSelectedRiwaya] = useState<Riwaya | 'all'>('all');
  const [selectedLetter, setSelectedLetter] = useState<string>('all');
  const [searchFocused, setSearchFocused] = useState(false);

  const { favorites } = useFavorites(); // local favorites

  const { bg, textPrimary, textSecondary, errorPrimary } =
    getThemeColors(isDark);
  const isVeryWide = width >= 2800;
  const isWide = width >= 2200 && width < 2800;
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: bg,
      padding: 20,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: bg,
    },
    loadingText: {
      color: textPrimary,
      marginTop: 10,
      fontSize: isVeryWide ? 24 : isWide ? 20 : 16,
    },

    errorMessage: {
      fontSize: isVeryWide ? 20 : isWide ? 18 : 16,
      color: textSecondary,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 24,
    },
    errorContainer: {
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    errorTitle: {
      fontSize: isVeryWide ? 32 : isWide ? 28 : 24,
      fontWeight: '700',
      color: textPrimary,
      marginTop: 20,
      marginBottom: 12,
    },
  });

  const loadReciters = useCallback(async (lang: 'ar' | 'en') => {
    const requestId = ++requestIdRef.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const cached = await getCachedRecitersInfo(lang);
      if (requestId !== requestIdRef.current) return;

      // Serve cached data instantly.
      if (cached && cached.data.length > 0) {
        setReciters(cached.data);
        setLoading(false);

        // Fresh cache + same enabled sources -> skip the background refresh.
        const currentSourcesKey = Object.keys(enabledSourcesRef.current)
          .sort()
          .join('|');
        if (
          cached.sourcesKey === currentSourcesKey &&
          Date.now() - cached.timestamp < SOFT_CACHE_TTL_MS
        ) {
          return;
        }
      }

      const sourceResults = await fetchRecitersBySource(
        lang,
        enabledSourcesRef.current,
        controller.signal,
      );
      if (requestId !== requestIdRef.current) return;

      // Merge: a source that returned empty keeps its previously cached
      // reciters (e.g. a temporary outage) instead of vanishing.
      const cachedSources = cached?.sources ?? {};
      const mergedSources: Record<string, Reciter[]> = {};
      for (const result of sourceResults) {
        mergedSources[result.source] =
          result.reciters.length > 0
            ? result.reciters
            : (cachedSources[result.source] ?? []);
      }

      const merged = Object.values(mergedSources).flat();
      setReciters(merged);

      // Never overwrite the cache with an empty result.
      if (merged.length > 0) {
        await setCachedReciters(mergedSources, lang);
      }
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      // Aborts (superseded/unmounted) are not real failures.
      if (err instanceof Error && err.name === 'AbortError') return;

      console.error('Failed to load reciters:', err);
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Failed to load reciters. Please try again.';
      setError(errorMsg);
      setReciters([]);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const lang = i18n.language === 'ar' ? 'ar' : 'en';
    loadReciters(lang);
  }, [i18n.language, sourcesSignature, cacheEpoch, loadReciters]);

  // Cancel any in-flight load when the screen unmounts so stale responses
  // cannot write state afterwards.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      requestIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    setSelectedRiwaya('all');
    setSelectedLetter('all');
  }, [i18n.language]);

  useEffect(() => {
    const rn = route.name as string | undefined;
    if (rn === 'Search') {
      const q = route.params?.q as string | undefined;
      const riw = route.params?.riwaya as string | undefined;
      setSearchQuery(q ?? '');
      if (riw && (Object.values(Riwaya) as string[]).includes(riw)) {
        setSelectedRiwaya(riw as Riwaya);
      } else {
        setSelectedRiwaya('all');
      }
    }
  }, [route]);

  const handleRetry = () => {
    const lang = i18n.language === 'ar' ? 'ar' : 'en';
    loadReciters(lang);
  };

  const handleReciterPress = useCallback(
    (reciter: Reciter) => {
      navigation.navigate('Player', { reciter });
    },
    [navigation],
  );

  const mostViewedReciters = useMemo<Reciter[]>(() => {
    if (reciters.length === 0) {
      return [];
    }

    return reciters
      .map((reciter) => {
        const viewCount = viewCounts[String(reciter.id)] ?? 0;
        return { reciter, viewCount };
      })
      .filter(({ viewCount }) => viewCount > 0)
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 10)
      .map(({ reciter }) => reciter);
  }, [reciters, viewCounts]);

  const myFavoritedReciters = useMemo(() => {
    if (!reciters.length || !favorites.length) return [];
    const favSet = new Set(favorites);
    return reciters
      .filter((reciter) => favSet.has(String(reciter.id)))
      .sort((a, b) => a.name.localeCompare(b.name, lang));
  }, [reciters, favorites, lang]);
  const recentlyPlayedReciters = useMemo(() => {
    if (!reciters.length || !recentlyPlayed.length) return [];
    const reciterMap = new Map<string, Reciter>();
    reciters.forEach((r) => {
      reciterMap.set(String(r.id), r);
    });

    // Map recently played IDs to actual reciter objects, maintaining order
    return recentlyPlayed
      .map((item) => reciterMap.get(item.reciterId))
      .filter((reciter): reciter is Reciter => reciter !== undefined);
  }, [reciters, recentlyPlayed]);
  const mostFavoritedReciters = useMemo(() => {
    if (!reciters.length) return [];

    const uniqueById = new Map<string, Reciter>();
    reciters.forEach((r) => {
      const idStr = String(r.id);
      if (!uniqueById.has(idStr)) {
        uniqueById.set(idStr, r);
      }
    });

    const favorited = Array.from(uniqueById.values())
      .filter((r) => {
        const idStr = String(r.id);
        const count = favoriteCounts[idStr] || 0;
        return count > 0;
      })
      .sort((a, b) => {
        const aCount = favoriteCounts[String(a.id)] || 0;
        const bCount = favoriteCounts[String(b.id)] || 0;
        return bCount - aCount;
      })
      .slice(0, 10);

    return favorited;
  }, [reciters, favoriteCounts]);

  const lettersForCurrentLang = useMemo(() => {
    const letters = new Set<string>();
    const matchesRiwaya = (r: Reciter) =>
      selectedRiwaya === 'all' || r.moshaf.riwaya === selectedRiwaya;
    reciters.filter(matchesRiwaya).forEach((r) => {
      let ch = r.name.charAt(0);
      if (!ch || !/[A-Za-z\u0600-\u06FF]/.test(ch)) return;
      if (lang === 'ar') {
        ch = normalizeArabicLetter(ch);
      }
      letters.add(ch);
    });
    return Array.from(letters).sort((a, b) =>
      a.localeCompare(b, lang === 'ar' ? 'ar' : undefined),
    );
  }, [reciters, lang, selectedRiwaya]);

  const filteredReciters = useMemo(() => {
    const matchesRiwaya = (reciter: Reciter) =>
      selectedRiwaya === 'all' || reciter.moshaf.riwaya === selectedRiwaya;

    // 1. Get base list filtered by Riwaya
    let baseList = reciters.filter(matchesRiwaya);

    const normalizedQuery = normalizeSearchText(searchQuery, lang);

    // 2. If no search query, sort alphabetically and return
    if (!normalizedQuery.length) {
      let result = baseList;

      // Apply letter filter when no search query
      if (selectedLetter && selectedLetter !== 'all') {
        result = result.filter((r) => {
          let reciterFirstChar = r.name.charAt(0);
          if (lang === 'ar') {
            const normalizedChar = normalizeArabicLetter(reciterFirstChar);
            return normalizedChar === selectedLetter;
          }
          const match =
            reciterFirstChar.toUpperCase() === selectedLetter.toUpperCase();

          return match;
        });
      }

      const sorted = result.sort((a, b) => {
        return a.name.localeCompare(b.name, lang);
      });
      return sorted;
    }

    // 3. If there is a search query, run Fuse.js (keep relevance order, don't alphabetical sort)
    type ReciterSearchItem = Reciter & {
      searchName: string;
      searchMoshafName: string;
    };

    const items: ReciterSearchItem[] = baseList.map((reciter) => ({
      ...reciter,
      searchName: normalizeSearchText(reciter.name, lang),
      searchMoshafName: normalizeSearchText(reciter.moshaf.name, lang),
    }));

    const fuse = new Fuse(items, {
      keys: [
        { name: 'searchName', weight: 0.6 },
        { name: 'searchMoshafName', weight: 0.4 },
      ],
      threshold: 0.4,
      ignoreLocation: true,
      minMatchCharLength: 1,
    });

    const results = fuse.search(normalizedQuery);
    return results.map((entry) => entry.item);
  }, [reciters, searchQuery, lang, selectedRiwaya, selectedLetter]);

  const { cardsPerRow, itemWidth } = useReciterGridLayout(
    filteredReciters,
    width,
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colorPrimary} />
        <Text style={styles.loadingText}>{t('Loading_Reciters')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={errorPrimary} />
          <Text style={styles.errorTitle}>{t('Failed_to_Load_Reciters')}</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <RetryButton onPress={handleRetry} />
        </View>
      </View>
    );
  }

  if (!loading && reciters.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <EmptyState
          icon="library-outline"
          title={t('No_Reciters_Found_Title')}
          message={t('No_Reciters_Found_Content')}
        />
        <RetryButton onPress={handleRetry} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionTopNav isRTL={isRTL} isDark={isDark} />
      <BrandHeader />

      <SpatialNavigationScrollView>
        <SpatialNavigationView direction="vertical">
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocusChange={setSearchFocused}
            isDark={isDark}
          />

          <SectionFilters
            selectedRiwaya={selectedRiwaya}
            onSelectRiwaya={setSelectedRiwaya}
            isRTL={isRTL}
          />

          <SectionLetterFilter
            letters={lettersForCurrentLang}
            selectedLetter={selectedLetter}
            onSelectLetter={setSelectedLetter}
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
              onReciterPress={handleReciterPress}
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
            onReciterPress={handleReciterPress}
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
            onReciterPress={handleReciterPress}
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
            onReciterPress={handleReciterPress}
            isVeryWide={isVeryWide}
            isWide={isWide}
            textPrimary={textPrimary}
          />

          {filteredReciters.length > 0 ? (
            <View style={{ marginTop: 20 }}>
              <Text
                style={{
                  color: textPrimary,
                  fontSize: isVeryWide ? 28 : isWide ? 24 : 20,
                  fontWeight: '700',
                  marginBottom: 12,
                  paddingHorizontal: 20,
                }}
              >
                {t('reciters')} ({filteredReciters.length})
              </Text>
              <SectionRecitersGrid
                reciters={filteredReciters}
                cardsPerRow={cardsPerRow}
                itemWidth={itemWidth}
                onReciterPress={handleReciterPress}
                preferredFirstFocus={!searchFocused}
                viewCounts={viewCounts}
                favoriteCounts={favoriteCounts}
              />
            </View>
          ) : (
            <EmptyState
              icon="search-outline"
              title={t('No_Search_Results_Title')}
              message={t('No_Search_Results_Content')}
            />
          )}
        </SpatialNavigationView>
      </SpatialNavigationScrollView>
    </View>
  );
}
