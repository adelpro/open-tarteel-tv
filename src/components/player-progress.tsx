import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { type AudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import { colorPrimary } from '../constants/interaction-colors';
import { getThemeColors } from '../constants/theme';
import { useSettings } from '../context/settings.context';

/**
 * Formats a number of seconds as `m:ss`, zero padded on both parts.
 * Invalid, negative or missing values are rendered as `00:00`.
 */
export const formatPlaybackTime = (seconds: number): string => {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const minutes = Math.floor(safe / 60)
    .toString()
    .padStart(2, '0');
  const remainder = Math.floor(safe % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${remainder}`;
};

type PlayerProgressProps = {
  player: AudioPlayer;
};

/**
 * Renders the playback progress bar and the `m:ss / m:ss` readout.
 *
 * The audio status subscription lives here, and only here, so a status tick
 * re-renders this small component instead of the whole player column. The
 * `player` prop is the stable `expo-audio` instance, so no prop changes per
 * tick.
 */
const PlayerProgress = ({ player }: PlayerProgressProps) => {
  const { isDark } = useSettings();
  const styles = createStyles(isDark);

  const { currentTime, duration } = useAudioPlayerStatus(player);

  const progressPercent =
    duration > 0
      ? Math.min(100, Math.max(0, (currentTime / duration) * 100))
      : 0;

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBarBackground}>
        <View
          style={[
            styles.progressBarForeground,
            { width: `${progressPercent}%` },
          ]}
        />
      </View>
      <Text style={styles.progressText}>
        {formatPlaybackTime(currentTime)} / {formatPlaybackTime(duration)}
      </Text>
    </View>
  );
};

function createStyles(isDark: boolean) {
  const { textSecondary } = getThemeColors(isDark);

  return StyleSheet.create({
    progressContainer: { width: '100%', marginVertical: 6 },
    progressBarBackground: {
      height: 4,
      backgroundColor: '#555',
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressBarForeground: {
      height: 4,
      backgroundColor: colorPrimary,
      borderRadius: 2,
    },
    progressText: {
      marginTop: 4,
      fontSize: 12,
      color: textSecondary,
      textAlign: 'right',
    },
  });
}

export default memo(PlayerProgress);
