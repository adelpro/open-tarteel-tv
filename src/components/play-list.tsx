import React, { memo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { FlatList as RNFlatList } from "react-native";
import {
  SpatialNavigationFocusableView,
  SpatialNavigationView,
} from "react-tv-space-navigation";
import {
  colorPrimaryGreen,
  colorPrimaryGreenLight,
  focusScale,
} from "../constants/interaction-colors";

const SURAH_ITEM_HEIGHT = 64;

type SurahItemData = {
  id: number;
  name: string;
  englishName: string;
  revelationType: string;
  ayahCount: number;
};

type PlaylistProps = {
  playlistRef: React.RefObject<RNFlatList<SurahItemData> | null>;
  playlistData: SurahItemData[];
  selectedSurah: number | null;
  onSurahPress: (id: number) => void;
};

type SurahItemProps = SurahItemData & {
  selected: boolean;
  preferredFocus: boolean;
  onPress: (id: number) => void;
};

const SurahItem = memo(
  ({ id, englishName, selected, onPress }: SurahItemProps) => (
    <SpatialNavigationFocusableView onSelect={() => onPress(id)}>
      {({ isFocused }) => (
        <Pressable
          style={[
            styles.surahCard,
            selected && styles.surahCardSelected,
            isFocused && styles.surahCardFocused,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Surah ${englishName} number ${id}`}
          onPress={() => onPress(id)}
        >
          <Text style={styles.surahNumber}>{id}</Text>
          <Text style={styles.surahName} numberOfLines={1}>
            {englishName}
          </Text>
        </Pressable>
      )}
    </SpatialNavigationFocusableView>
  )
);

const Playlist = ({
  playlistRef,
  playlistData,
  selectedSurah,
  onSurahPress,
}: PlaylistProps) => (
  <View style={styles.playlistPanel}>
    <View style={styles.playlistHeaderRow}>
      <Text style={styles.playlistTitle}>Playlist</Text>
    </View>

    <View style={styles.playlistBody}>
      <SpatialNavigationView direction="vertical">
        <FlatList
          ref={playlistRef}
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
              id={item.id}
              name={item.name}
              englishName={item.englishName}
              revelationType={item.revelationType}
              ayahCount={item.ayahCount}
              selected={selectedSurah === item.id}
              preferredFocus={index === 0}
              onPress={onSurahPress}
            />
          )}
        />
      </SpatialNavigationView>
    </View>
  </View>
);

const styles = StyleSheet.create({
  playlistPanel: {
    height: "100%",
    marginLeft: 12,
    width: 320,
    backgroundColor: "#181818",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#262626",
    overflow: "hidden",
  },
  playlistHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#262626",
  },
  playlistTitle: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
  playlistBody: {
    flex: 1,
  },
  playlistContent: {
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
    backgroundColor: "#181818",
    borderWidth: 1,
    borderColor: "#262626",
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
    color: "#B0B0B0",
    marginRight: 12,
  },
  surahName: {
    fontSize: 14,
    color: "#fff",
    flexShrink: 1,
  },
});

export default memo(Playlist);
