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

  // Calculate strict heights to remove empty space below cards
  // Base card height approx 180-220. We add ~30px buffer for Focus Scale effect.
  const containerHeight = isVeryWide ? 250 : isWide ? 230 : 210;
  const cardWidth = Math.max(itemWidth, 220);

  const styles = StyleSheet.create({
    container: {
      // Removed marginVertical to stop huge gaps.
      // Only adding marginBottom separates this row from the next one.
      marginBottom: 15,
    },
    sectionTitle: {
      fontSize: isVeryWide ? 26 : 22,
      fontWeight: "700",
      color: textPrimary,
      // Removed marginTop (relying on container spacing)
      marginTop: 0,
      // Brought title closer to the cards
      marginBottom: 8,
      textAlign: isRTL ? "right" : "left",
      paddingHorizontal: 20, // Aligns with the cards
      opacity: 0.9,
    },
    reciterItem: {
      // Allow the focus animation to overlap boundaries without being clipped
      overflow: "visible",
      // Vertical margin for the shadow/scale effect
      marginVertical: 10,
    },
    scrollContent: {
      paddingHorizontal: 20,
      // Helps with focus clipping
      flexGrow: 1,
    },
  });

  return (
    <SpatialNavigationView direction="vertical" style={styles.container}>
      <Text style={styles.sectionTitle}>{title}</Text>

      <View style={{ height: containerHeight }}>
        <SpatialNavigationScrollView
          horizontal
          offsetFromStart={20} // Keeps the focused item slightly to the right/left
          style={{ height: "100%" }}
        >
          <SpatialNavigationView
            direction="horizontal"
            style={{
              flexDirection: "row",
              direction: isRTL ? "rtl" : "ltr",
              alignItems: "center",
              justifyContent: "flex-start",
              paddingHorizontal: 20, // Add padding inside the scroll view
            }}
          >
            {reciters.map((reciter, index) => (
              <View
                key={`${title}-${reciter.id}-${index}`}
                style={[
                  styles.reciterItem,
                  {
                    width: cardWidth,
                    marginEnd: 12, // Gap between cards
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
