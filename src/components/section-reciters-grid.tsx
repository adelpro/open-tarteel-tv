import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';
import { SpatialNavigationView } from 'react-tv-space-navigation';

import ReciterCard from './reciter-card';
import { useItemHeight } from '../hooks/ise-item-height';
import type { Reciter } from '../types';

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
    overflow: 'visible',
  },
  row: {
    flexDirection: 'row',
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
  const isRTL = i18n.dir() === 'rtl';

  // Group reciters into rows so the outer SpatialNavigationScrollView
  // can scroll natively to each row without any transform conflict.
  const rows = useMemo(() => {
    const result: Reciter[][] = [];
    for (let i = 0; i < reciters.length; i += cardsPerRow) {
      result.push(reciters.slice(i, i + cardsPerRow));
    }
    return result;
  }, [reciters, cardsPerRow]);

  return (
    <SpatialNavigationView direction="vertical">
      {rows.map((row, rowIndex) => (
        <SpatialNavigationView
          key={rowIndex}
          direction="horizontal"
          style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}
        >
          {row.map((reciter, colIndex) => {
            const globalIndex = rowIndex * cardsPerRow + colIndex;
            return (
              <View
                key={`${rowIndex}-${colIndex}`}
                style={[
                  styles.item,
                  {
                    width: itemWidth,
                    height: itemHeight,
                    marginHorizontal: 4,
                    marginVertical: 8,
                  },
                ]}
              >
                <ReciterCard
                  reciter={reciter}
                  preferredFocus={preferredFirstFocus && globalIndex === 0}
                  onPress={onReciterPress}
                  viewCount={viewCounts[reciter.id.toString()]}
                  favoriteCount={favoriteCounts[reciter.id.toString()]}
                />
              </View>
            );
          })}
        </SpatialNavigationView>
      ))}
    </SpatialNavigationView>
  );
}
