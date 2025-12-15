import React, { memo } from "react";
import { Pressable, Text, View } from "react-native";
import {
  SpatialNavigationFocusableView,
  SpatialNavigationView,
} from "react-tv-space-navigation";
import { FontAwesome } from "@expo/vector-icons";
import { Reciter } from "../types";
import AudioSpectrum from "./audio-spectrum";

type PlayerStyles = {
  playerColumn: any;
  metadataCard: any;
  metadataTitle: any;
  metadataSubtitle: any;
  metadataMeta: any;
  metadataMetaSecondary?: any;
  playerArea: any;
  playerControls: any;
  nowPlaying: any;
  controlsMeta: any;
  spectrumRow: any;
  spectrumBar: any;
  controlsRow: any;
  controlBtnRect: any;
  controlBtnRectWide: any;
  controlBtnDisabled: any;
  controlBtnFocused: any;
  controlBtnActive: any;
  arabicText: any;
};

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
  styles: PlayerStyles;
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
  styles,
  onPlayPause,
  onStop,
  onPrevious,
  onNext,
  onVolumeChange,
  onToggleMute,
  onToggleRepeat,
}: PlayerProps) => (
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
        <AudioSpectrum playing={hasSelection && isPlaying} styles={styles} />
        <SpatialNavigationView direction="horizontal">
          <View style={styles.controlsRow}>
            <SpatialNavigationFocusableView onSelect={onStop}>
              {({ isFocused }) => (
                <Pressable
                  style={[
                    styles.controlBtnRect,
                    controlsDisabled && styles.controlBtnDisabled,
                    isFocused && !controlsDisabled && styles.controlBtnFocused,
                  ]}
                  focusable={!controlsDisabled}
                  disabled={controlsDisabled}
                  accessibilityRole="button"
                  accessibilityLabel="Stop"
                  onPress={onStop}
                >
                  <FontAwesome
                    name="stop"
                    size={24}
                    color={isFocused && !controlsDisabled ? "#4CAF50" : "#fff"}
                  />
                </Pressable>
              )}
            </SpatialNavigationFocusableView>

            <SpatialNavigationFocusableView onSelect={onPrevious}>
              {({ isFocused }) => (
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
              )}
            </SpatialNavigationFocusableView>

            <SpatialNavigationFocusableView onSelect={onPlayPause}>
              {({ isFocused }) => (
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
              )}
            </SpatialNavigationFocusableView>

            <SpatialNavigationFocusableView
              onSelect={() => onVolumeChange(-0.1)}
            >
              {({ isFocused }) => (
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
              )}
            </SpatialNavigationFocusableView>

            <SpatialNavigationFocusableView>
              {({ isFocused }) => (
                <Pressable
                  style={[
                    styles.controlBtnRect,
                    controlsDisabled && styles.controlBtnDisabled,
                    isFocused && !controlsDisabled && styles.controlBtnFocused,
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
                    color={isFocused && !controlsDisabled ? "#4CAF50" : "#fff"}
                  />
                </Pressable>
              )}
            </SpatialNavigationFocusableView>

            <SpatialNavigationFocusableView
              onSelect={() => onVolumeChange(0.1)}
            >
              {({ isFocused }) => (
                <Pressable
                  style={[
                    styles.controlBtnRect,
                    controlsDisabled && styles.controlBtnDisabled,
                    isFocused && !controlsDisabled && styles.controlBtnFocused,
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
                    color={isFocused && !controlsDisabled ? "#4CAF50" : "#fff"}
                  />
                </Pressable>
              )}
            </SpatialNavigationFocusableView>

            <SpatialNavigationFocusableView onSelect={onToggleMute}>
              {({ isFocused }) => (
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
              )}
            </SpatialNavigationFocusableView>

            <SpatialNavigationFocusableView onSelect={onToggleRepeat}>
              {({ isFocused }) => (
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
              )}
            </SpatialNavigationFocusableView>
          </View>
        </SpatialNavigationView>
      </View>
    </View>
  </View>
);

export default memo(Player);
