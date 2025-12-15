import React, { memo } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import type { FlatList as RNFlatList } from "react-native";
import {
  SpatialNavigationFocusableView,
  SpatialNavigationView,
} from "react-tv-space-navigation";

type SurahItemData = {
  id: number;
  name: string;
  englishName: string;
  revelationType: string;
  ayahCount: number;
};

type PlaylistStyles = {
  playlistPanel: any;
  playlistHeaderRow: any;
  playlistTitle: any;
  playlistBody: any;
  playlistContent: any;
  surahCard: any;
  surahCardFocused: any;
  surahCardSelected: any;
  surahNumber: any;
  surahName: any;
};

type PlaylistProps = {
  styles: PlaylistStyles;
  playlistRef: React.RefObject<RNFlatList<SurahItemData> | null>;
  playlistData: SurahItemData[];
  selectedSurah: number | null;
  onSurahPress: (id: number) => void;
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
    <SpatialNavigationFocusableView>
      {({ isFocused }) => (
        <Pressable
          style={[
            styles.surahCard,
            isFocused && styles.surahCardFocused,
            selected && styles.surahCardSelected,
          ]}
          focusable
          hasTVPreferredFocus={preferredFocus}
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
  styles,
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
          initialNumToRender={18}
          maxToRenderPerBatch={18}
          windowSize={10}
          removeClippedSubviews
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
              styles={styles}
            />
          )}
        />
      </SpatialNavigationView>
    </View>
  </View>
);

export default memo(Playlist);
