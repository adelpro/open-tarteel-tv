import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { SpatialNavigationVirtualizedGrid } from "react-tv-space-navigation";

import ReciterCard from "./reciter-card";
import type { Reciter } from "../types";
import { useItemHeight } from "../hooks/ise-item-height";
import { useTranslation } from "react-i18next";

const GRID_ROW_GAP = 15;

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
  const { i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";

  const gridItemHeight = itemHeight + GRID_ROW_GAP;

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
    [
      favoriteCounts,
      itemHeight,
      itemWidth,
      onReciterPress,
      preferredFirstFocus,
      viewCounts,
    ],
  );

  return (
    <SpatialNavigationVirtualizedGrid<Reciter>
      data={reciters}
      style={{
        width: "100%",
        direction: isRTL ? "rtl" : "ltr",
        flexDirection: isRTL ? "row-reverse" : "row",
      }}
      numberOfColumns={cardsPerRow}
      itemHeight={gridItemHeight}
      renderItem={renderItem}
      rowContainerStyle={{}}
    />
  );
}
