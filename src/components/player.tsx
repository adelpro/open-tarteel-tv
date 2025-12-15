import React, { memo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import {
  SpatialNavigationFocusableView,
  SpatialNavigationView,
} from "react-tv-space-navigation";
import { FontAwesome } from "@expo/vector-icons";
import AudioSpectrum from "./audio-spectrum";
import {
  colorPrimaryGreen,
  colorPrimaryGreenDark,
  colorPrimaryGreenLight,
  focusScale,
} from "../constants/interaction-colors";
import { getThemeColors } from "../constants/theme";
import type { PlayerState } from "../hooks/use-player";

const isArabicText = (text: string) => /[\u0600-\u06FF]/.test(text);

type PlayerProps = { player: PlayerState };

const Player = ({ player }: PlayerProps) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";

  const {
    playlistData,
    reciter,
    selectedSurah,
    isPlaying,
    volume,
    repeat,
    muted,
    handlePlayPause,
    handlePrevious,
    handleNext,
    handleVolumeChange,
    handleToggleMute,
    handleToggleRepeat,
  } = player;

  const hasSelection = selectedSurah !== null;
  const currentSurah = hasSelection
    ? playlistData.find((s) => s.id === selectedSurah)
    : null;
  const controlsDisabled = !hasSelection;
  const isCurrentSurahNameArabic = isArabicText(currentSurah?.name ?? "");

  const styles = createStyles(isDark);

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
              {currentSurah?.englishName ?? "Select a surah"}
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
              Track {currentSurah?.id ?? "-"} of {reciter.moshaf.surah_total}
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
              ? `Now Playing: ${currentSurah?.englishName ?? ""}`
              : "Select a surah to start playing"}
          </Text>
          <Text style={styles.controlsMeta}>
            {hasSelection
              ? `Volume ${Math.round(volume * 100)}% ${
                  muted ? "(Muted)" : ""
                } • Repeat ${repeat ? "On" : "Off"}`
              : "Playback controls will be enabled once a surah is selected"}
          </Text>
          <AudioSpectrum playing={hasSelection && isPlaying} />

          <SpatialNavigationView
            direction="horizontal"
            style={styles.controlsRow}
          >
            {[
              { icon: "step-backward", onSelect: handlePrevious, size: 28 },
              {
                icon: isPlaying ? "pause" : "play",
                onSelect: handlePlayPause,
                size: 28,
                wide: true,
              },
              { icon: "step-forward", onSelect: handleNext, size: 28 },
              {
                icon: "volume-down",
                onSelect: () => handleVolumeChange(-0.1),
                size: 24,
              },
              {
                icon: "volume-up",
                onSelect: () => handleVolumeChange(0.1),
                size: 24,
              },
              {
                icon: "volume-off",
                onSelect: handleToggleMute,
                size: 24,
                active: muted,
              },
              {
                icon: "repeat",
                onSelect: handleToggleRepeat,
                size: 22,
                active: repeat,
              },
            ].map((btn, index) => (
              <SpatialNavigationFocusableView
                key={index}
                onSelect={btn.onSelect}
              >
                {({ isFocused }) => (
                  <Pressable
                    onPress={btn.onSelect}
                    focusable
                    accessibilityRole="button"
                    disabled={controlsDisabled}
                    style={[
                      styles.controlBtn,
                      btn.wide
                        ? styles.controlBtnRectWide
                        : styles.controlBtnRect,
                      btn.active && styles.controlBtnActive,
                      isFocused &&
                        !controlsDisabled &&
                        styles.controlBtnFocused,
                      controlsDisabled && styles.controlBtnDisabled,
                    ]}
                  >
                    <FontAwesome
                      name={btn.icon as any}
                      size={btn.size}
                      color={
                        btn.active || (isFocused && !controlsDisabled)
                          ? colorPrimaryGreen
                          : "#fff"
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
  const controlBg = isDark ? "#232323" : "#E0E0E0";
  const controlBgWide = isDark ? "#2F2F2F" : "#DADADA";

  return StyleSheet.create({
    playerColumn: { flex: 1, justifyContent: "flex-start" },
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
    controlsMeta: { fontSize: 12, color: textSecondary, marginBottom: 16 },
    playerControls: {
      paddingHorizontal: 24,
      paddingVertical: 18,
      backgroundColor: panelBg,
      borderTopWidth: 2,
      borderTopColor: colorPrimaryGreen,
      alignItems: "center",
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
    },
    controlBtnRectWide: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: controlBgWide,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: "transparent",
      padding: 0,
    },

    controlBtn: {
      marginHorizontal: 8,
    },

    controlBtnRect: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: controlBg,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: "transparent",
    },

    controlBtnFocused: {
      backgroundColor: "red",
    },
    controlBtnDisabled: { opacity: 0.4 },
    controlBtnActive: {
      borderColor: colorPrimaryGreen,
      backgroundColor: panelBg,
    },
    arabicText: { textAlign: "right", writingDirection: "rtl" },
    controlsRow: { flexDirection: "row", alignItems: "center" },
  });
}

export default memo(Player);
