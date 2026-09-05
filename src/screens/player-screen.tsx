import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import {
  SpatialNavigationView,
  SpatialNavigationVirtualizedListRef,
} from 'react-tv-space-navigation';

import Playlist from '../components/play-list';
import PlayerComponent from '../components/player';
import RetryButton from '../components/retry-button';
import { colorPrimary } from '../constants/interaction-colors';
import { getThemeColors } from '../constants/theme';
import { useRecentlyPlayed } from '../context/recently-played.context';
import { useSettings } from '../context/settings.context';
import { usePlayer } from '../hooks/use-player';
import { useViewCounts } from '../hooks/use-view-counts';

export default function PlayerScreen() {
  const { isDark, keepScreenAwake } = useSettings();
  const styles = createStyles(isDark);
  const playlistRef = useRef<SpatialNavigationVirtualizedListRef | null>(null);

  const { incrementView } = useViewCounts();
  const { addToRecentlyPlayed } = useRecentlyPlayed();
  const player = usePlayer();
  const {
    playlistData,
    reciter,
    selectedSurah,
    playlistLoading,
    playlistError,
    retryLoadPlaylist,
  } = player;

  useEffect(() => {
    if (reciter?.id) {
      incrementView(reciter.id.toString());
      addToRecentlyPlayed(reciter.id.toString());
    }
  }, [reciter?.id, incrementView, addToRecentlyPlayed]);

  useEffect(() => {
    if (!selectedSurah) return;

    const index = playlistData.findIndex((s) => s.id === selectedSurah);

    if (index >= 0) {
      playlistRef.current?.focus(index);
    }
  }, [playlistData, selectedSurah]);

  useEffect(() => {
    if (keepScreenAwake) {
      activateKeepAwakeAsync('player-screen');
    } else {
      deactivateKeepAwake('player-screen');
    }
    return () => {
      deactivateKeepAwake('player-screen');
    };
  }, [keepScreenAwake]);

  if (playlistLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colorPrimary} />
        <Text style={styles.errorText}>Loading playlist…</Text>
      </View>
    );
  }

  if (playlistError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load playlist</Text>
        <RetryButton onPress={retryLoadPlaylist} />
      </View>
    );
  }

  if (!reciter) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No reciter selected</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SpatialNavigationView direction="horizontal" style={styles.mainContent}>
        <PlayerComponent player={player} />
        <Playlist player={player} listRef={playlistRef} />
      </SpatialNavigationView>
    </View>
  );
}

function createStyles(isDark: boolean) {
  const { bg, textPrimary } = getThemeColors(isDark);
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: bg,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: bg,
    },
    errorText: {
      color: textPrimary,
      fontSize: 18,
    },
    mainContent: {
      flex: 1,
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 20,
    },
  });
}
