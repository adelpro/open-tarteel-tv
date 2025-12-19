import React, { memo, useEffect, useMemo } from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";
import {
  SpatialNavigationFocusableView,
  SpatialNavigationVirtualizedList,
  SpatialNavigationVirtualizedListRef,
  SpatialNavigationView,
} from "react-tv-space-navigation";
import {
  colorPrimary,
  colorPrimaryDark,
  colorPrimaryLight,
} from "../constants/interaction-colors";
import { getThemeColors } from "../constants/theme";
import type { PlayerState } from "../hooks/use-player";

const SURAH_ITEM_HEIGHT = 64;

type PlaylistProps = {
  listRef: React.RefObject<SpatialNavigationVirtualizedListRef | null>;
  player: PlayerState;
};

const Playlist = ({ player, listRef }: PlaylistProps) => {
  const { handleSurahPress, playlistData, selectedSurah } = player;
  const isDark = useColorScheme() !== "light";
  const styles = createStyles(isDark);

  const memoizedData = useMemo(() => playlistData, [playlistData]);

  useEffect(() => {
    if (selectedSurah === null && memoizedData.length > 0) {
      handleSurahPress(memoizedData[0].id);
    }
  }, [handleSurahPress, memoizedData, selectedSurah]);

  useEffect(() => {
    const index = memoizedData.findIndex((surah) => surah.id === selectedSurah);
    if (index >= 0 && listRef.current) {
      listRef.current.focus(index);
    }
  }, [memoizedData, selectedSurah]);

  const renderItem = ({ item }: { item: (typeof memoizedData)[0] }) => (
    <SpatialNavigationFocusableView
      onSelect={() => handleSurahPress(item.id)}
      style={styles.surahCard}
    >
      {({ isFocused }) => {
        const isActive = selectedSurah === item.id;
        const showFocus = isFocused && !isActive;

        return (
          <View
            style={[
              styles.surahCard,
              isActive && styles.surahCardSelected,
              showFocus && styles.surahCardFocused,
            ]}
          >
            <View
              style={[
                styles.surahNumberWrapper,
                showFocus && styles.surahNumberWrapperFocused,
                isActive && styles.surahNumberWrapperSelected,
              ]}
            >
              <Text
                style={[
                  styles.surahNumber,
                  showFocus && styles.surahNumberFocused,
                  isActive && styles.surahNumberSelected,
                ]}
              >
                {item.id}
              </Text>
            </View>

            <Text
              numberOfLines={1}
              style={[styles.surahName, showFocus && styles.surahNameFocused]}
            >
              {item.englishName}
            </Text>
          </View>
        );
      }}
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
            additionalItemsRendered={2}
            data={memoizedData}
            itemSize={SURAH_ITEM_HEIGHT}
            orientation="vertical"
            renderItem={renderItem}
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
      backgroundColor: cardBg,
      borderRadius: 12,
      height: "100%",
      marginLeft: 12,
      overflow: "hidden",
      width: 320,
    },
    playlistHeaderRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    playlistTitle: {
      color: textPrimary,
      fontSize: 14,
      fontWeight: "600",
    },
    playlistBody: {
      flex: 1,
    },
    playlistContent: {
      paddingBottom: 8,
      paddingTop: 8,
    },

    surahCard: {
      alignItems: "center",
      backgroundColor: cardBg,
      flexDirection: "row",
      height: SURAH_ITEM_HEIGHT,
      paddingHorizontal: 8,
      width: "100%",
    },
    surahCardFocused: {
      backgroundColor: isDark ? colorPrimaryDark : colorPrimaryLight,
      borderColor: colorPrimary,
      borderWidth: 1,
    },
    surahCardSelected: {
      backgroundColor: colorPrimary,
    },

    // Number wrapper
    surahNumberWrapper: {
      alignItems: "center",
      height: 28,
      justifyContent: "center",
      marginRight: 10,
      width: 28,
    },
    surahNumberWrapperFocused: {
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
      borderRadius: 14,
    },
    surahNumberWrapperSelected: {
      backgroundColor: colorPrimary,
      borderRadius: 14,
    },

    // Number text
    surahNumber: {
      fontSize: 12,
      fontWeight: "500",
      color: textSecondary,
      textAlign: "center",
    },
    surahNumberFocused: {
      color: colorPrimary,
    },
    surahNumberSelected: {
      color: textSecondary,
      fontWeight: "600",
    },

    // Surah name
    surahName: {
      color: textPrimary,
      flexShrink: 1,
      fontSize: 14,
    },
    surahNameFocused: {
      color: colorPrimary,
    },
  });
}

export default memo(Playlist);
