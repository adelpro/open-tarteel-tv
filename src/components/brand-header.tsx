import React, { memo } from "react";
import { Image, Text, View } from "react-native";

type BrandHeaderProps = {
  styles: {
    brandRow: any;
    brandLogo: any;
    brandTitle: any;
    brandSubtitle: any;
  };
};

const BrandHeader = ({ styles }: BrandHeaderProps) => (
  <View style={styles.brandRow}>
    <Image
      source={require("../../assets/icon.png")}
      style={styles.brandLogo}
    />
    <View>
      <Text style={styles.brandTitle}>Open Tarteel TV</Text>
      <Text style={styles.brandSubtitle}>
        Quran recitations • TV optimized
      </Text>
    </View>
  </View>
);

export default memo(BrandHeader);

