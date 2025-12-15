import React, { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  SpatialNavigationFocusableView,
  SpatialNavigationView,
} from "react-tv-space-navigation";
import { FontAwesome } from "@expo/vector-icons";
import { Reciter } from "../types";
import AudioSpectrum from "./audio-spectrum";
import { colorPrimaryGreen, focusScale } from "../constants/interaction-colors";

type PlayerProps = {
  reciter: Reciter;
  currentSurah: {
    id: number;
    englishName: string;
    name: string;
  } | null;
  hasSelection: boolean;
  isPlaying: boolean;
  volume: number;
  muted: boolean;
  repeat: boolean;
  controlsDisabled: boolean;
  isCurrentSurahNameArabic: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onVolumeChange: (delta: number) => void;
  onToggleMute: () => void;
  onToggleRepeat: () => void;
};

const Player = ({
  reciter,
  currentSurah,
  hasSelection,
  isPlaying,
  volume,
  muted,
  repeat,
  controlsDisabled,
  isCurrentSurahNameArabic,
  onPlayPause,
  onStop,
  onPrevious,
  onNext,
  onVolumeChange,
  onToggleMute,
  onToggleRepeat,
}: PlayerProps) => {
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
              {renderControl(onPrevious, (isFocused) => (
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
                  onPress={onPrevious}
                >
                  <FontAwesome
                    name="step-backward"
                    size={28}
                    color={isFocused && !controlsDisabled ? "#4CAF50" : "#fff"}
                  />
                </Pressable>
              ))}

              {renderControl(onPlayPause, (isFocused) => (
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
                  onPress={onPlayPause}
                >
                  <FontAwesome
                    name={isPlaying ? "pause" : "play"}
                    size={32}
                    color={isFocused && !controlsDisabled ? "#4CAF50" : "#fff"}
                  />
                </Pressable>
              ))}

              {renderControl(onNext, (isFocused) => (
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
                  onPress={onNext}
                >
                  <FontAwesome
                    name="step-forward"
                    size={28}
                    color={isFocused && !controlsDisabled ? "#4CAF50" : "#fff"}
                  />
                </Pressable>
              ))}

              {renderControl(
                () => onVolumeChange(-0.1),
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
                    onPress={() => onVolumeChange(-0.1)}
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
                () => onVolumeChange(0.1),
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
                    onPress={() => onVolumeChange(0.1)}
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

              {renderControl(onToggleMute, (isFocused) => (
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
                  onPress={onToggleMute}
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

              {renderControl(onToggleRepeat, (isFocused) => (
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
                  onPress={onToggleRepeat}
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
                {renderControl(onPrevious, (isFocused) => (
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
                    onPress={onPrevious}
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

                {renderControl(onPlayPause, (isFocused) => (
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
                    onPress={onPlayPause}
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

                {renderControl(onNext, (isFocused) => (
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
                    onPress={onNext}
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
                  () => onVolumeChange(-0.1),
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
                      onPress={() => onVolumeChange(-0.1)}
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
                  () => onVolumeChange(0.1),
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
                      onPress={() => onVolumeChange(0.1)}
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

                {renderControl(onToggleMute, (isFocused) => (
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
                    onPress={onToggleMute}
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

                {renderControl(onToggleRepeat, (isFocused) => (
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
                    onPress={onToggleRepeat}
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

const styles = StyleSheet.create({
  playerColumn: {
    flex: 1,
    justifyContent: "center",
  },
  playerArea: {
    marginTop: 12,
  },
  metadataCard: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  metadataTitle: {
    fontSize: 20,
    color: "#fff",
    marginBottom: 4,
  },
  metadataSubtitle: {
    fontSize: 16,
    color: "#DDD",
    marginBottom: 4,
  },
  metadataMeta: {
    fontSize: 12,
    color: "#AAA",
  },
  nowPlaying: {
    fontSize: 18,
    color: "#fff",
    marginBottom: 6,
  },
  controlsMeta: {
    fontSize: 12,
    color: "#AAA",
    marginBottom: 16,
  },
  playerControls: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    backgroundColor: "#1E1E1E",
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
    backgroundColor: "#232323",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  controlBtnRectWide: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#2F2F2F",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  controlBtnFocused: {
    borderColor: colorPrimaryGreen,
    backgroundColor: "#2E2E2E",
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
    backgroundColor: "#1E1E1E",
  },
  arabicText: {
    textAlign: "right",
    writingDirection: "rtl",
  },
});

export default memo(Player);
