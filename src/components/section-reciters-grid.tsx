import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { SpatialNavigationVirtualizedGrid } from "react-tv-space-navigation";

import ReciterCard from "./reciter-card";
import type { Reciter } from "../types";
import { useItemHeight } from "../hooks/ise-item-height";

type SectionRecitersGridProps = {
  reciters: Reciter[];
  cardsPerRow: number;
  itemWidth: number;
  onReciterPress: (reciter: Reciter) => void;
  preferredFirstFocus: boolean;
  viewCounts: Record<string, number>;
  favoriteCounts: Record<string, number>;
};

const styles = StyleSheet.create({
  item: {
    overflow: "visible",
  },
});

const ITEM_HEIGHT = 120; // must be stable for virtualization

export default function SectionRecitersGrid({
  reciters,
  cardsPerRow,
  itemWidth,
  onReciterPress,
  preferredFirstFocus,
  viewCounts,
  favoriteCounts,
}: SectionRecitersGridProps) {
  const { itemHeight } = useItemHeight();

  const renderItem = useCallback(
    ({ item, index }: { item: Reciter; index: number }) => (
      <View
        style={[
          styles.item,
          {
            width: itemWidth,
            height: itemHeight,
            marginHorizontal: 4,
          },
        ]}
      >
        <ReciterCard
          key={`view-${item.id}-${index}`}
          reciter={item}
          preferredFocus={preferredFirstFocus && index === 0}
          onPress={onReciterPress}
          viewCount={viewCounts[item.id.toString()]}
          favoriteCount={favoriteCounts[item.id.toString()]}
        />
      </View>
    ),
    [favoriteCounts, itemWidth, onReciterPress, preferredFirstFocus, viewCounts]
  );

  return (
    <SpatialNavigationVirtualizedGrid<Reciter>
      data={reciters}
      numberOfColumns={cardsPerRow}
      itemHeight={ITEM_HEIGHT}
      renderItem={renderItem}
    />
  );
}
