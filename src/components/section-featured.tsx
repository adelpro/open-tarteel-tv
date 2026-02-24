import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  SpatialNavigationScrollView,
  SpatialNavigationView,
} from 'react-tv-space-navigation';

import ReciterCard from './reciter-card';
import { useItemHeight } from '../hooks/ise-item-height';
import { Reciter } from '../types';

type FeaturedSectionProps = {
  title: string;
  reciters: Reciter[];
  itemWidth: number;
  isRTL: boolean;
  viewCounts: Record<string, number>;
  favoriteCounts: Record<string, number>;
  onReciterPress: (reciter: Reciter) => void;
  isVeryWide: boolean;
  isWide: boolean;
  textPrimary: string;
};

const SectionFeatured = ({
  title,
  reciters,
  itemWidth,
  isRTL,
  viewCounts,
  favoriteCounts,
  onReciterPress,
  isVeryWide,
  textPrimary,
}: FeaturedSectionProps) => {
  const { itemHeight } = useItemHeight();

  if (reciters.length === 0) return null;

  const containerHeight = itemHeight + 20; // 10 is the marginBottom

  const styles = StyleSheet.create({
    container: {
      marginBottom: 5,
    },
    contentContainer: {
      height: containerHeight,
    },
    sectionTitle: {
      fontSize: isVeryWide ? 26 : 22,
      fontWeight: '700',
      color: textPrimary,
      marginBottom: 8,
      textAlign: isRTL ? 'right' : 'left',
      paddingHorizontal: 10,
      opacity: 0.9,
    },
    scrollContent: {
      direction: isRTL ? 'rtl' : 'ltr',
      flexDirection: isRTL ? 'row-reverse' : 'row',
      paddingHorizontal: 20,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{title}</Text>

      <View style={styles.contentContainer}>
        <SpatialNavigationScrollView horizontal offsetFromStart={20}>
          <SpatialNavigationView
            direction="horizontal"
            style={styles.scrollContent}
          >
            {reciters.map((reciter, index) => (
              <View
                key={`view-${title}-${reciter.id}-${index}`}
                style={[
                  {
                    width: itemWidth,
                    height: itemHeight,
                    marginHorizontal: 4,
                  },
                ]}
              >
                <ReciterCard
                  key={`${title}-${reciter.id}-${index}`}
                  reciter={reciter}
                  preferredFocus={index === 0} // first card gets focus
                  onPress={onReciterPress}
                  viewCount={viewCounts[String(reciter.id)]}
                  favoriteCount={favoriteCounts[String(reciter.id)]}
                />
              </View>
            ))}
          </SpatialNavigationView>
        </SpatialNavigationScrollView>
      </View>
    </View>
  );
};

export default SectionFeatured;
