import React, { memo } from "react";
import { Pressable, Text } from "react-native";
import { SpatialNavigationFocusableView } from "react-tv-space-navigation";
import { Reciter, Riwaya } from "../types";

type ReciterCardProps = {
  reciter: Reciter;
  preferredFocus: boolean;
  onPress: (reciter: Reciter) => void;
  styles: {
    reciterCard: any;
    reciterCardFocused: any;
    reciterName: any;
    reciterDesc: any;
  };
};

const riwayaLabel = (r: Riwaya) => {
  if (r === Riwaya.WARSH_AN_NAFI) return "Warsh";
  if (r === Riwaya.QALUN_AN_NAFI) return "Qalun";
  if (r === Riwaya.ALDURI_AN_ALKAISSAI) return "Ad-Duri";
  return "Hafs";
};

const ReciterCard = ({
  reciter,
  preferredFocus,
  onPress,
  styles,
}: ReciterCardProps) => (
  <SpatialNavigationFocusableView onSelect={() => onPress(reciter)}>
    {({ isFocused }) => (
      <Pressable
        style={[styles.reciterCard, isFocused && styles.reciterCardFocused]}
        focusable
        hasTVPreferredFocus={preferredFocus}
        accessibilityRole="button"
        accessibilityLabel={`Reciter ${reciter.name}, Moshaf ${reciter.moshaf.name}`}
      >
        <Text style={styles.reciterName} numberOfLines={1} ellipsizeMode="tail">
          {reciter.name}
        </Text>
        <Text style={styles.reciterDesc} numberOfLines={2} ellipsizeMode="tail">
          {reciter.moshaf.name} • {riwayaLabel(reciter.moshaf.riwaya)}
        </Text>
      </Pressable>
    )}
  </SpatialNavigationFocusableView>
);

export default memo(ReciterCard);
