import React, { memo } from "react";
import { Pressable, Text, TextStyle, ViewStyle } from "react-native";
import { SpatialNavigationFocusableView } from "react-tv-space-navigation";
import { Reciter, Riwaya } from "../types";
import RiwayaTag from "./riwaya-tag";

type ReciterCardProps = {
  reciter: Reciter;
  preferredFocus: boolean;
  onPress: (reciter: Reciter) => void;
  styles: {
    reciterCard: ViewStyle;
    reciterCardFocused: ViewStyle;
    reciterName: TextStyle;
    reciterDesc: TextStyle;
  };
};

const RIWAYA_LABEL: Record<Riwaya, string> = {
  [Riwaya.HAFS_A_ASIM]: "Hafs",
  [Riwaya.WARSH_AN_NAFI]: "Warsh",
  [Riwaya.QALUN_AN_NAFI]: "Qalun",
  [Riwaya.ALDURI_AN_ALKAISSAI]: "Ad-Duri",
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
          {reciter.moshaf.name} • {RIWAYA_LABEL[reciter.moshaf.riwaya]}
        </Text>
        <RiwayaTag riwaya={reciter.moshaf.riwaya} />
      </Pressable>
    )}
  </SpatialNavigationFocusableView>
);

export default memo(ReciterCard);
