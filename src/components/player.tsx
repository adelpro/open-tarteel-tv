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

  const renderControl = (
    onSelect: () => void,
    renderPressable: (isFocused: boolean) => React.ReactElement
  ) => (
    <SpatialNavigationFocusableView
      onSelect={() => {
        onSelect();
      }}
    >
      {({ isFocused }) => {
        return renderPressable(isFocused);
      }}
    </SpatialNavigationFocusableView>
  );

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
            {renderControl(handlePrevious, (isFocused) => (
              <Pressable
                onPress={handlePrevious}
                style={[
                  styles.controlBtn,
                  styles.controlBtnRect,
                  isFocused && styles.controlBtnFocused,
                  controlsDisabled && styles.controlBtnDisabled,
                ]}
              >
                <FontAwesome
                  name="step-backward"
                  size={28}
                  color={isFocused && !controlsDisabled ? "#4CAF50" : "#fff"}
                />
              </Pressable>
            ))}

            {renderControl(handlePlayPause, (isFocused) => (
              <Pressable
                onPress={handlePlayPause}
                style={[
                  styles.controlBtn,
                  styles.controlBtnRectWide,
                  isFocused && styles.controlBtnFocused,
                  controlsDisabled && styles.controlBtnDisabled,
                ]}
              >
                <FontAwesome
                  name={isPlaying ? "pause" : "play"}
                  size={28} // proportional to wide button
                  color={isFocused && !controlsDisabled ? "#4CAF50" : "#fff"}
                />
              </Pressable>
            ))}

            {renderControl(handleNext, (isFocused) => (
              <Pressable
                onPress={handleNext}
                style={[
                  styles.controlBtn,
                  styles.controlBtnRect,
                  isFocused && styles.controlBtnFocused,
                  controlsDisabled && styles.controlBtnDisabled,
                ]}
              >
                <FontAwesome
                  name="step-forward"
                  size={28}
                  color={isFocused && !controlsDisabled ? "#4CAF50" : "#fff"}
                />
              </Pressable>
            ))}

            {renderControl(
              () => handleVolumeChange(-0.1),
              (isFocused) => (
                <Pressable
                  onPress={() => handleVolumeChange(-0.1)}
                  style={[
                    styles.controlBtn,
                    styles.controlBtnRect,
                    isFocused && styles.controlBtnFocused,
                    controlsDisabled && styles.controlBtnDisabled,
                  ]}
                >
                  <FontAwesome
                    name="volume-down"
                    size={24}
                    color={isFocused && !controlsDisabled ? "#4CAF50" : "#fff"}
                  />
                </Pressable>
              )
            )}

            {renderControl(
              () => handleVolumeChange(0.1),
              (isFocused) => (
                <Pressable
                  onPress={() => handleVolumeChange(0.1)}
                  style={[
                    styles.controlBtn,
                    styles.controlBtnRect,
                    isFocused && styles.controlBtnFocused,
                    controlsDisabled && styles.controlBtnDisabled,
                  ]}
                >
                  <FontAwesome
                    name="volume-up"
                    size={24}
                    color={isFocused && !controlsDisabled ? "#4CAF50" : "#fff"}
                  />
                </Pressable>
              )
            )}

            {renderControl(handleToggleMute, (isFocused) => (
              <Pressable
                onPress={handleToggleMute}
                style={[
                  styles.controlBtn,
                  styles.controlBtnRect,
                  muted && styles.controlBtnActive,
                  isFocused && styles.controlBtnFocused,
                  controlsDisabled && styles.controlBtnDisabled,
                ]}
              >
                <FontAwesome
                  name="volume-off"
                  size={24}
                  color={
                    muted || (isFocused && !controlsDisabled)
                      ? "#4CAF50"
                      : "#fff"
                  }
                />
              </Pressable>
            ))}

            {renderControl(handleToggleRepeat, (isFocused) => (
              <Pressable
                onPress={handleToggleRepeat}
                style={[
                  styles.controlBtn,
                  styles.controlBtnRect,
                  repeat && styles.controlBtnActive,
                  isFocused && styles.controlBtnFocused,
                  controlsDisabled && styles.controlBtnDisabled,
                ]}
              >
                <FontAwesome
                  name="repeat"
                  size={22}
                  color={
                    repeat || (isFocused && !controlsDisabled)
                      ? "#4CAF50"
                      : "#fff"
                  }
                />
              </Pressable>
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
      backgroundColor: isDark ? colorPrimaryGreenDark : colorPrimaryGreenLight,
      borderColor: colorPrimaryGreen,
      transform: [{ scale: focusScale }],
      shadowColor: "#000",
      shadowOpacity: 0.35,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 10,
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
