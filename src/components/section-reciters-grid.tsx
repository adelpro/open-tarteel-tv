import React from "react";
import { StyleSheet, View } from "react-native";
import {
  SpatialNavigationScrollView,
  SpatialNavigationView,
} from "react-tv-space-navigation";
import ReciterCard from "./reciter-card";
import { Reciter } from "../types";

type SectionRecitersGridProps = {
  reciterRows: Reciter[][];
  itemWidth: number;
  onReciterPress: (reciter: Reciter) => void;
  searchFocused: boolean;
  viewCounts: Record<string, number>;
  favoriteCounts: Record<string, number>;
  isRTL: boolean;
};

const SectionRecitersGrid = ({
  reciterRows,
  itemWidth,
  onReciterPress,
  searchFocused,
  viewCounts,
  favoriteCounts,
  isRTL,
}: SectionRecitersGridProps) => {
  const styles = StyleSheet.create({
    reciterRow: {
      marginBottom: 16,
      overflow: "visible",
      paddingHorizontal: 20,
    },
    reciterItem: {
      overflow: "visible",
      marginVertical: 8,
    },
  });

  return (
    <SpatialNavigationScrollView
      horizontal
      style={{ flex: 1 }}
      contentContainerStyle={{
        width: "100%",
        paddingHorizontal: 20,
      }}
    >
      {reciterRows.map((row, rowIndex) => (
        <SpatialNavigationView
          key={`row-${rowIndex}`}
          direction="horizontal"
          style={styles.reciterRow}
        >
          {row.map((reciter, cardIndex) => (
            <View
              style={[
                styles.reciterItem,
                {
                  width: itemWidth,
                  marginRight: cardIndex === row.length - 1 ? 0 : 12,
                },
              ]}
              key={`${reciter.id}-${reciter.moshaf.id}`}
            >
              <ReciterCard
                reciter={reciter}
                preferredFocus={
                  !searchFocused && rowIndex === 0 && cardIndex === 0
                }
                onPress={onReciterPress}
                viewCount={viewCounts[reciter.id.toString()]}
                favoriteCount={favoriteCounts[reciter.id.toString()]}
              />
            </View>
          ))}
        </SpatialNavigationView>
      ))}
    </SpatialNavigationScrollView>
  );
};

export default SectionRecitersGrid;
