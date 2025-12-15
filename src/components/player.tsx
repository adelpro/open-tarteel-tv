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
import { colorPrimaryGreen, focusScale } from "../constants/interaction-colors";
import { getThemeColors } from "../constants/theme";
import type { PlayerState } from "../hooks/use-player";

const isArabicText = (text: string) => /[\u0600-\u06FF]/.test(text);

type PlayerProps = {
  player: PlayerState;
};

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
  ) => {
    if (controlsDisabled) {
      return renderPressable(false);
    }
    return (
      <SpatialNavigationFocusableView onSelect={onSelect}>
        {({ isFocused }) => renderPressable(isFocused)}
      </SpatialNavigationFocusableView>
    );
  };

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
          {controlsDisabled ? (
            <View style={styles.controlsRow}>
              {renderControl(handlePrevious, (isFocused) => (
                <Pressable
                  style={[
                    styles.controlBtnRect,
                    controlsDisabled && styles.controlBtnDisabled,
                    isFocused && !controlsDisabled && styles.controlBtnFocused,
                  ]}
                  focusable={!controlsDisabled}
                  disabled={controlsDisabled}
                  accessibilityRole="button"
                  accessibilityLabel="Previous"
                  onPress={handlePrevious}
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
                  style={[
                    styles.controlBtnRectWide,
                    controlsDisabled && styles.controlBtnDisabled,
                    isFocused && !controlsDisabled && styles.controlBtnFocused,
                  ]}
                  focusable={!controlsDisabled}
                  disabled={controlsDisabled}
                  accessibilityRole="button"
                  accessibilityLabel={isPlaying ? "Pause" : "Play"}
                  onPress={handlePlayPause}
                >
                  <FontAwesome
                    name={isPlaying ? "pause" : "play"}
                    size={32}
                    color={isFocused && !controlsDisabled ? "#4CAF50" : "#fff"}
                  />
                </Pressable>
              ))}

              {renderControl(handleNext, (isFocused) => (
                <Pressable
                  style={[
                    styles.controlBtnRect,
                    controlsDisabled && styles.controlBtnDisabled,
                    isFocused && !controlsDisabled && styles.controlBtnFocused,
                  ]}
                  focusable={!controlsDisabled}
                  disabled={controlsDisabled}
                  accessibilityRole="button"
                  accessibilityLabel="Next"
                  onPress={handleNext}
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
                    style={[
                      styles.controlBtnRect,
                      controlsDisabled && styles.controlBtnDisabled,
                      isFocused &&
                        !controlsDisabled &&
                        styles.controlBtnFocused,
                    ]}
                    focusable={!controlsDisabled}
                    disabled={controlsDisabled}
                    accessibilityRole="button"
                    accessibilityLabel="Volume down"
                    onPress={() => handleVolumeChange(-0.1)}
                  >
                    <FontAwesome
                      name="volume-down"
                      size={24}
                      color={
                        isFocused && !controlsDisabled ? "#4CAF50" : "#fff"
                      }
                    />
                  </Pressable>
                )
              )}

              {renderControl(
                () => handleVolumeChange(0.1),
                (isFocused) => (
                  <Pressable
                    style={[
                      styles.controlBtnRect,
                      controlsDisabled && styles.controlBtnDisabled,
                      isFocused &&
                        !controlsDisabled &&
                        styles.controlBtnFocused,
                    ]}
                    focusable={!controlsDisabled}
                    disabled={controlsDisabled}
                    accessibilityRole="button"
                    accessibilityLabel="Volume up"
                    onPress={() => handleVolumeChange(0.1)}
                  >
                    <FontAwesome
                      name="volume-up"
                      size={24}
                      color={
                        isFocused && !controlsDisabled ? "#4CAF50" : "#fff"
                      }
                    />
                  </Pressable>
                )
              )}

              {renderControl(handleToggleMute, (isFocused) => (
                <Pressable
                  style={[
                    styles.controlBtnRect,
                    controlsDisabled && styles.controlBtnDisabled,
                    muted && styles.controlBtnActive,
                    isFocused && !controlsDisabled && styles.controlBtnFocused,
                  ]}
                  focusable={!controlsDisabled}
                  disabled={controlsDisabled}
                  accessibilityRole="button"
                  accessibilityLabel={muted ? "Unmute" : "Mute"}
                  onPress={handleToggleMute}
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
                  style={[
                    styles.controlBtnRect,
                    controlsDisabled && styles.controlBtnDisabled,
                    repeat && styles.controlBtnActive,
                    isFocused && !controlsDisabled && styles.controlBtnFocused,
                  ]}
                  focusable={!controlsDisabled}
                  disabled={controlsDisabled}
                  accessibilityRole="button"
                  accessibilityLabel="Toggle repeat"
                  onPress={handleToggleRepeat}
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
            </View>
          ) : (
            <SpatialNavigationView direction="horizontal">
              <View style={styles.controlsRow}>
                {renderControl(handlePrevious, (isFocused) => (
                  <Pressable
                    style={[
                      styles.controlBtnRect,
                      controlsDisabled && styles.controlBtnDisabled,
                      isFocused &&
                        !controlsDisabled &&
                        styles.controlBtnFocused,
                    ]}
                    focusable={!controlsDisabled}
                    disabled={controlsDisabled}
                    accessibilityRole="button"
                    accessibilityLabel="Previous"
                    onPress={handlePrevious}
                  >
                    <FontAwesome
                      name="step-backward"
                      size={28}
                      color={
                        isFocused && !controlsDisabled ? "#4CAF50" : "#fff"
                      }
                    />
                  </Pressable>
                ))}

                {renderControl(handlePlayPause, (isFocused) => (
                  <Pressable
                    style={[
                      styles.controlBtnRectWide,
                      controlsDisabled && styles.controlBtnDisabled,
                      isFocused &&
                        !controlsDisabled &&
                        styles.controlBtnFocused,
                    ]}
                    focusable={!controlsDisabled}
                    disabled={controlsDisabled}
                    accessibilityRole="button"
                    accessibilityLabel={isPlaying ? "Pause" : "Play"}
                    onPress={handlePlayPause}
                  >
                    <FontAwesome
                      name={isPlaying ? "pause" : "play"}
                      size={32}
                      color={
                        isFocused && !controlsDisabled ? "#4CAF50" : "#fff"
                      }
                    />
                  </Pressable>
                ))}

                {renderControl(handleNext, (isFocused) => (
                  <Pressable
                    style={[
                      styles.controlBtnRect,
                      controlsDisabled && styles.controlBtnDisabled,
                      isFocused &&
                        !controlsDisabled &&
                        styles.controlBtnFocused,
                    ]}
                    focusable={!controlsDisabled}
                    disabled={controlsDisabled}
                    accessibilityRole="button"
                    accessibilityLabel="Next"
                    onPress={handleNext}
                  >
                    <FontAwesome
                      name="step-forward"
                      size={28}
                      color={
                        isFocused && !controlsDisabled ? "#4CAF50" : "#fff"
                      }
                    />
                  </Pressable>
                ))}

                {renderControl(
                  () => handleVolumeChange(-0.1),
                  (isFocused) => (
                    <Pressable
                      style={[
                        styles.controlBtnRect,
                        controlsDisabled && styles.controlBtnDisabled,
                        isFocused &&
                          !controlsDisabled &&
                          styles.controlBtnFocused,
                      ]}
                      focusable={!controlsDisabled}
                      disabled={controlsDisabled}
                      accessibilityRole="button"
                      accessibilityLabel="Volume down"
                      onPress={() => handleVolumeChange(-0.1)}
                    >
                      <FontAwesome
                        name="volume-down"
                        size={24}
                        color={
                          isFocused && !controlsDisabled ? "#4CAF50" : "#fff"
                        }
                      />
                    </Pressable>
                  )
                )}

                {renderControl(
                  () => handleVolumeChange(0.1),
                  (isFocused) => (
                    <Pressable
                      style={[
                        styles.controlBtnRect,
                        controlsDisabled && styles.controlBtnDisabled,
                        isFocused &&
                          !controlsDisabled &&
                          styles.controlBtnFocused,
                      ]}
                      focusable={!controlsDisabled}
                      disabled={controlsDisabled}
                      accessibilityRole="button"
                      accessibilityLabel="Volume up"
                      onPress={() => handleVolumeChange(0.1)}
                    >
                      <FontAwesome
                        name="volume-up"
                        size={24}
                        color={
                          isFocused && !controlsDisabled ? "#4CAF50" : "#fff"
                        }
                      />
                    </Pressable>
                  )
                )}

                {renderControl(handleToggleMute, (isFocused) => (
                  <Pressable
                    style={[
                      styles.controlBtnRect,
                      controlsDisabled && styles.controlBtnDisabled,
                      muted && styles.controlBtnActive,
                      isFocused &&
                        !controlsDisabled &&
                        styles.controlBtnFocused,
                    ]}
                    focusable={!controlsDisabled}
                    disabled={controlsDisabled}
                    accessibilityRole="button"
                    accessibilityLabel={muted ? "Unmute" : "Mute"}
                    onPress={handleToggleMute}
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
                    style={[
                      styles.controlBtnRect,
                      controlsDisabled && styles.controlBtnDisabled,
                      repeat && styles.controlBtnActive,
                      isFocused &&
                        !controlsDisabled &&
                        styles.controlBtnFocused,
                    ]}
                    focusable={!controlsDisabled}
                    disabled={controlsDisabled}
                    accessibilityRole="button"
                    accessibilityLabel="Toggle repeat"
                    onPress={handleToggleRepeat}
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
              </View>
            </SpatialNavigationView>
          )}
        </View>
      </View>
    </View>
  );
};

function createStyles(isDark: boolean) {
  const { textPrimary, textSecondary, cardBg, border, focusBg } =
    getThemeColors(isDark);
  const panelBg = cardBg;
  const controlBg = isDark ? "#232323" : "#E0E0E0";
  const controlBgWide = isDark ? "#2F2F2F" : "#DADADA";
  const controlFocusedBg = focusBg;
  return StyleSheet.create({
    playerColumn: {
      flex: 1,
      justifyContent: "flex-start",
    },
    playerArea: {
      marginTop: 12,
    },
    metadataCard: {
      marginTop: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: border,
    },
    metadataTitle: {
      fontSize: 20,
      color: textPrimary,
      marginBottom: 4,
    },
    metadataSubtitle: {
      fontSize: 16,
      color: textSecondary,
      marginBottom: 4,
    },
    metadataMeta: {
      fontSize: 12,
      color: textSecondary,
    },
    nowPlaying: {
      fontSize: 18,
      color: textPrimary,
      marginBottom: 6,
    },
    controlsMeta: {
      fontSize: 12,
      color: textSecondary,
      marginBottom: 16,
    },
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
    controlsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 18,
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
    controlBtnRectWide: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: controlBgWide,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: "transparent",
    },
    controlBtnFocused: {
      borderColor: colorPrimaryGreen,
      backgroundColor: controlFocusedBg,
      transform: [{ scale: focusScale }],
      shadowColor: "#4CAF50",
      shadowOpacity: 0.7,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 0 },
      elevation: 8,
    },
    controlBtnDisabled: {
      opacity: 0.4,
    },
    controlBtnActive: {
      borderColor: colorPrimaryGreen,
      backgroundColor: panelBg,
    },
    arabicText: {
      textAlign: "right",
      writingDirection: "rtl",
    },
  });
}

export default memo(Player);
