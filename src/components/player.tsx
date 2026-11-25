import React, { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  SpatialNavigationFocusableView,
  SpatialNavigationView,
} from 'react-tv-space-navigation';

import AudioSpectrum from './audio-spectrum';
import PlayerProgress from './player-progress';
import {
  colorPrimary,
  colorPrimaryLight,
} from '../constants/interaction-colors';
import { getThemeColors } from '../constants/theme';
import { useFavorites } from '../context/favorites.context';
import { useSettings } from '../context/settings.context';
import type { PlayerCoreState } from '../hooks/use-player';
import { getPlayerStatusLabel } from '../utils/player-label';

const isArabicText = (text: string) => /[\u0600-\u06FF]/.test(text);

type PlayerProps = { player: PlayerCoreState };

export const Player = ({ player }: PlayerProps) => {
  const { isDark } = useSettings();
  const styles = createStyles(isDark);
  const { isFavorited, toggleFavorite } = useFavorites();
  const { t } = useTranslation();

  const {
    audioPlayer,
    playlistData,
    reciter,
    selectedSurah,
    isPlaying,
    repeat,
    handlePlayPause,
    handlePrevious,
    handleNext,
    handleToggleRepeat,
    handleSeekBackward,
    handleSeekForward,
  } = player;

  const favorited = reciter ? isFavorited(reciter.id.toString()) : false;

  const PLAYER_CONTROLS = [
    {
      icon: 'step-backward',
      onSelect: handlePrevious,
      size: 22,
      key: 'backward',
    },
    {
      icon: 'rotate-left',
      onSelect: handleSeekBackward,
      size: 25,
      key: 'seek-backward',
    },
    {
      icon: isPlaying ? 'pause' : 'play',
      onSelect: handlePlayPause,
      size: 28,
      wide: true,
      key: 'play-pause',
    },
    {
      icon: 'rotate-right',
      onSelect: handleSeekForward,
      size: 25,
      key: 'seek-forward',
    },
    { icon: 'step-forward', onSelect: handleNext, size: 28, key: 'forward' },
    {
      icon: favorited ? 'heart' : 'heart-o',
      onSelect: () => reciter && toggleFavorite(reciter.id.toString()),
      size: 22,
      active: favorited,
      key: 'favorite',
    },
    {
      icon: 'refresh',
      onSelect: handleToggleRepeat,
      size: 22,
      active: repeat,
      key: 'repeat',
    },
  ];

  const hasSelection = selectedSurah !== null;
  const currentSurah = hasSelection
    ? (playlistData.find((s) => s.id === selectedSurah) ?? null)
    : null;

  const isCurrentSurahNameArabic = useMemo(
    () => isArabicText(currentSurah?.name ?? ''),
    [currentSurah?.name],
  );

  if (!reciter) {
    return (
      <View style={styles.playerColumn}>
        <View style={styles.metadataCard}>
          <Text style={styles.metadataTitle}>No reciter selected</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.playerColumn}>
      <View style={styles.metadataCard}>
        {hasSelection ? (
          <>
            <Text style={styles.metadataTitle}>
              {currentSurah?.englishName ?? 'Select a surah'}
            </Text>
            <Text
              style={[
                styles.metadataSubtitle,
                isCurrentSurahNameArabic && styles.arabicText,
              ]}
            >
              {currentSurah?.name}
            </Text>
            <Text style={styles.metadataMeta}>
              {reciter.name} • {reciter.moshaf.name}
            </Text>
            <Text style={styles.metadataMeta}>
              Track {currentSurah?.id ?? '-'} of {reciter.moshaf.surah_total}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.metadataTitle}>Select a surah</Text>
            <Text style={styles.metadataSubtitle}>
              Use the playlist on the right to start
            </Text>
          </>
        )}
      </View>

      <View style={styles.playerArea}>
        <View style={styles.playerControls}>
          <Text style={styles.nowPlaying}>
            {hasSelection
              ? `${t(getPlayerStatusLabel(isPlaying))}: ${
                  currentSurah?.englishName ?? currentSurah?.name ?? ''
                }`
              : 'Select a surah to start playing'}
          </Text>

          <AudioSpectrum playing={hasSelection && isPlaying} />

          {/* Progress bar — subscribes to the audio status on its own so a
              status tick does not re-render the controls. */}
          {hasSelection && <PlayerProgress player={audioPlayer} />}

          <SpatialNavigationView
            style={styles.controlsRow}
            direction="horizontal"
          >
            {PLAYER_CONTROLS.map((btn) => (
              <SpatialNavigationFocusableView
                key={btn.key}
                onSelect={btn.onSelect}
              >
                {({ isFocused }) => (
                  <Pressable
                    accessibilityRole="button"
                    key={btn.key}
                    //disabled={!hasSelection}
                    style={[
                      styles.controlBtn,
                      btn.wide
                        ? styles.controlBtnRectWide
                        : styles.controlBtnRect,
                      btn.active && styles.controlBtnActive,
                      isFocused && styles.controlBtnFocused,
                      /*  !hasSelection && styles.controlBtnDisabled, */
                    ]}
                  >
                    <FontAwesome
                      name={btn.icon as any}
                      size={btn.size}
                      color={
                        btn.active || (isFocused && hasSelection)
                          ? colorPrimary
                          : '#fff'
                      }
                    />
                  </Pressable>
                )}
              </SpatialNavigationFocusableView>
            ))}
          </SpatialNavigationView>
        </View>
      </View>
    </View>
  );
};

function createStyles(isDark: boolean) {
  const { textPrimary, textSecondary, cardBg, border } = getThemeColors(isDark);
  const panelBg = cardBg;
  const controlBg = isDark ? '#232323' : '#E0E0E0';
  const controlBgWide = isDark ? '#2F2F2F' : '#DADADA';

  return StyleSheet.create({
    playerColumn: { flex: 1, justifyContent: 'flex-start' },
    playerArea: { marginTop: 12 },
    metadataCard: {
      marginTop: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: border,
    },
    metadataTitle: { fontSize: 20, color: textPrimary, marginBottom: 4 },
    metadataSubtitle: { fontSize: 16, color: textSecondary, marginBottom: 4 },
    metadataMeta: { fontSize: 12, color: textSecondary },
    nowPlaying: { fontSize: 18, color: textPrimary, marginBottom: 6 },
    controlsMeta: { fontSize: 12, color: textSecondary, marginBottom: 8 },
    playerControls: {
      paddingHorizontal: 24,
      paddingVertical: 18,
      backgroundColor: panelBg,
      borderTopWidth: 2,
      borderTopColor: colorPrimary,
      alignItems: 'center',
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
    },
    controlBtnRectWide: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: controlBgWide,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
      padding: 0,
    },
    controlBtn: { marginHorizontal: 8 },
    controlBtnRect: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: controlBg,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    controlBtnFocused: { backgroundColor: colorPrimaryLight },
    controlBtnDisabled: { opacity: 0.4 },
    controlBtnActive: {
      borderColor: colorPrimary,
      backgroundColor: panelBg,
    },
    arabicText: { textAlign: 'right', writingDirection: 'rtl' },
    controlsRow: { flexDirection: 'row', alignItems: 'center' },
  });
}

export default memo(Player);
