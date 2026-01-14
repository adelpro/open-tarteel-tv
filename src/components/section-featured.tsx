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

  const containerHeight = isVeryWide ? 250 : isWide ? 230 : 210;
  const cardWidth = Math.max(itemWidth, 220);

  const styles = StyleSheet.create({
    container: {
      marginBottom: 15,
    },
    sectionTitle: {
      fontSize: isVeryWide ? 26 : 22,
      fontWeight: "700",
      color: textPrimary,
      marginBottom: 8,
      textAlign: isRTL ? "right" : "left",
      paddingHorizontal: 20,
      opacity: 0.9,
    },
    scrollContent: {
      flexDirection: "row",
      direction: isRTL ? "rtl" : "ltr",
      alignItems: "center",
      justifyContent: "flex-start",
      paddingHorizontal: 20,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{title}</Text>

      <View style={{ height: containerHeight }}>
        <SpatialNavigationScrollView
          horizontal
          offsetFromStart={20}
          style={{ height: "100%" }}
        >
          <SpatialNavigationView
            direction="horizontal"
            style={styles.scrollContent}
          >
            {reciters.map((reciter, index) => (
              <ReciterCard
                key={`${title}-${reciter.id}-${index}`}
                reciter={reciter}
                preferredFocus={index === 0} // first card gets focus
                onPress={onReciterPress}
                viewCount={viewCounts[String(reciter.id)]}
                favoriteCount={favoriteCounts[String(reciter.id)]}
              />
            ))}
          </SpatialNavigationView>
        </SpatialNavigationScrollView>
      </View>
    </View>
  );
};

export default SectionFeatured;
