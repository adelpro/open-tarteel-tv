import React, { memo, useMemo, useRef, useEffect } from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";
import {
  SpatialNavigationFocusableView,
  SpatialNavigationVirtualizedList,
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

type PlaylistProps = {
  player: PlayerState;
  listRef: React.RefObject<any>;
};

const Playlist = ({ player, listRef }: PlaylistProps) => {
  const { playlistData, selectedSurah, handleSurahPress } = player;
  const isDark = useColorScheme() !== "light";
  const styles = createStyles(isDark);

  const memoizedData = useMemo(() => playlistData, [playlistData]);

  useEffect(() => {
    const index = memoizedData.findIndex((s) => s.id === selectedSurah);
    if (index >= 0 && listRef.current) {
      listRef.current.focus(index);
    }
  }, [selectedSurah, memoizedData]);

  const renderItem = ({ item }: { item: (typeof memoizedData)[0] }) => (
    <SpatialNavigationFocusableView
      onSelect={() => handleSurahPress(item.id)}
      style={styles.surahCard}
    >
      {({ isFocused }) => (
        <View
          style={[
            styles.surahCard,
            selectedSurah === item.id && styles.surahCardSelected,
            isFocused && styles.surahCardFocused,
          ]}
        >
          <Text
            style={[
              styles.surahNumber,
              isFocused &&
                selectedSurah !== item.id &&
                styles.surahNumberFocused,
            ]}
          >
            {item.id}
          </Text>
          <Text
            style={[
              styles.surahName,
              isFocused && selectedSurah !== item.id && styles.surahNameFocused,
            ]}
            numberOfLines={1}
          >
            {item.englishName}
          </Text>
        </View>
      )}
    </SpatialNavigationFocusableView>
  );

  return (
    <View style={styles.playlistPanel}>
      <View style={styles.playlistHeaderRow}>
        <Text style={styles.playlistTitle}>Playlist</Text>
      </View>

      <View style={styles.playlistBody}>
        <SpatialNavigationView direction="vertical">
          <SpatialNavigationVirtualizedList
            ref={listRef}
            data={memoizedData}
            renderItem={renderItem}
            itemSize={SURAH_ITEM_HEIGHT}
            additionalItemsRendered={2}
            orientation="vertical"
            style={styles.playlistContent}
          />
        </SpatialNavigationView>
      </View>
    </View>
  );
};

function createStyles(isDark: boolean) {
  const { cardBg, textPrimary, textSecondary } = getThemeColors(isDark);
  return StyleSheet.create({
    playlistPanel: {
      height: "100%",
      marginLeft: 12,
      width: 320,
      backgroundColor: cardBg,
      borderRadius: 12,
      overflow: "hidden",
    },
    playlistHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 10,
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
      paddingBottom: 8,
      paddingHorizontal: 0,
    },
    surahCard: {
      height: SURAH_ITEM_HEIGHT,
      flexDirection: "row",
      alignItems: "center",
      width: "100%",
      backgroundColor: cardBg,
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
      color: colorPrimaryGreen,
    },
  });
}

export default memo(Playlist);
