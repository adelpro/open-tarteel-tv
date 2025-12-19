import React from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  SpatialNavigationScrollView,
  SpatialNavigationView,
} from "react-tv-space-navigation";
import ReciterCard from "./reciter-card";
import { Reciter } from "../types";

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
  isWide,
  textPrimary,
}: FeaturedSectionProps) => {
  if (reciters.length === 0) return null;

  const styles = StyleSheet.create({
    sectionTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: textPrimary,
      marginTop: 24,
      marginBottom: 16,
      textAlign: isRTL ? "right" : "left",
      paddingHorizontal: 20,
    },
    reciterItem: {
      overflow: "visible",
      marginVertical: 8,
    },
  });

  return (
    <SpatialNavigationView direction="vertical" style={{ marginVertical: 12 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View
        style={{
          height: isVeryWide ? 220 : isWide ? 200 : 180,
        }}
      >
        <SpatialNavigationScrollView
          horizontal
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            direction: isRTL ? "rtl" : "ltr",
            justifyContent: "flex-start",
          }}
        >
          <SpatialNavigationView direction="horizontal">
            {reciters.map((reciter, index) => (
              <View
                key={`${title}-${reciter.id}-${index}`}
                style={[
                  styles.reciterItem,
                  {
                    width: Math.max(itemWidth, 220),
                    marginRight: 12,
                  },
                ]}
              >
                <ReciterCard
                  reciter={reciter}
                  preferredFocus={false}
                  onPress={onReciterPress}
                  viewCount={viewCounts[String(reciter.id)]}
                  favoriteCount={favoriteCounts[String(reciter.id)]}
                />
              </View>
            ))}
          </SpatialNavigationView>
        </SpatialNavigationScrollView>
      </View>
    </SpatialNavigationView>
  );
};

export default SectionFeatured;
