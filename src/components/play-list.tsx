import React, { memo } from "react";
import {
  FlatList,
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
import {
  colorPrimaryGreen,
  colorPrimaryGreenLight,
  focusScale,
} from "../constants/interaction-colors";
import { getThemeColors } from "../constants/theme";
import type { PlayerState } from "../hooks/use-player";

const SURAH_ITEM_HEIGHT = 64;

type PlaylistStyles = ReturnType<typeof createStyles>;

type SurahItemData = {
  id: number;
  name: string;
  englishName: string;
  revelationType: string;
  ayahCount: number;
};

type SurahItemProps = SurahItemData & {
  selected: boolean;
  preferredFocus: boolean;
  onPress: (id: number) => void;
  styles: PlaylistStyles;
};

const SurahItem = memo(
  ({
    id,
    englishName,
    selected,
    preferredFocus,
    onPress,
    styles,
  }: SurahItemProps) => (
    <SpatialNavigationFocusableView onSelect={() => onPress(id)}>
      {({ isFocused }) => {
        return (
          <Pressable
            style={[
              styles.surahCard,
              selected && styles.surahCardSelected,
              isFocused && styles.surahCardFocused,
            ]}
            hasTVPreferredFocus={preferredFocus}
            accessibilityRole="button"
            accessibilityLabel={`Surah ${englishName} number ${id}`}
            onPress={() => onPress(id)}
            focusable
          >
            <Text
              style={[
                styles.surahNumber,
                isFocused && !selected && styles.surahNumberFocused,
              ]}
            >
              {id}
            </Text>
            <Text
              style={[
                styles.surahName,
                isFocused && !selected && styles.surahNameFocused,
              ]}
              numberOfLines={1}
            >
              {englishName}
            </Text>
          </Pressable>
        );
      }}
    </SpatialNavigationFocusableView>
  )
);

type PlaylistProps = {
  player: PlayerState;
};

const Playlist = ({ player }: PlaylistProps) => {
  const { playlistData, selectedSurah, handleSurahPress } = player;
  const isDark = useColorScheme() !== "light";
  const styles = createStyles(isDark);

  return (
    <View style={styles.playlistPanel}>
      <View style={styles.playlistHeaderRow}>
        <Text style={styles.playlistTitle}>Playlist</Text>
      </View>

      <View style={styles.playlistBody}>
        <SpatialNavigationView direction="vertical">
          <FlatList
            data={playlistData}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            getItemLayout={(_, index) => ({
              length: SURAH_ITEM_HEIGHT,
              offset: SURAH_ITEM_HEIGHT * index,
              index,
            })}
            removeClippedSubviews={true}
            initialNumToRender={8}
            maxToRenderPerBatch={8}
            windowSize={5}
            contentContainerStyle={styles.playlistContent}
            renderItem={({ item, index }) => (
              <SurahItem
                {...item}
                selected={selectedSurah === item.id}
                preferredFocus={index === 0}
                onPress={handleSurahPress}
                styles={styles}
              />
            )}
          />
        </SpatialNavigationView>
      </View>
    </View>
  );
};

function createStyles(isDark: boolean) {
  const { cardBg, textPrimary, textSecondary, border } = getThemeColors(isDark);
  return StyleSheet.create({
    playlistPanel: {
      height: "100%",
      marginLeft: 12,
      width: 320,
      backgroundColor: cardBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: border,
      overflow: "hidden",
    },
    playlistHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: border,
    },
    playlistTitle: {
      fontSize: 14,
      color: textPrimary,
      fontWeight: "600",
    },
    playlistBody: {
      flex: 1,
    },
    playlistContent: {
      paddingTop: 8,
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    surahCard: {
      height: SURAH_ITEM_HEIGHT,
      paddingHorizontal: 16,
      marginBottom: 8,
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 12,
      backgroundColor: cardBg,
      borderWidth: 1,
      borderColor: border,
    },
    surahCardFocused: {
      borderWidth: 2,
      borderColor: colorPrimaryGreenLight,
      transform: [{ scale: focusScale }],
      shadowColor: "#000",
      shadowOpacity: 0.3,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 8,
    },
    surahCardSelected: {
      backgroundColor: colorPrimaryGreen,
      borderColor: colorPrimaryGreen,
    },
    surahNumber: {
      fontSize: 12,
      fontWeight: "600",
      color: textSecondary,
      marginRight: 12,
    },
    surahName: {
      fontSize: 14,
      color: textPrimary,
      flexShrink: 1,
    },
    surahNumberFocused: {
      color: textPrimary,
    },
    surahNameFocused: {
      color: colorPrimaryGreenLight,
    },
  });
}

export default memo(Playlist);
