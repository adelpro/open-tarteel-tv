import React, { memo } from "react";
import { Text, View } from "react-native";
import { Riwaya } from "../types";

type RiwayaTagProps = {
  riwaya: Riwaya;
};

type RiwayaTagConfig = {
  label: string;
  backgroundColor: string;
};

const RIWAYA_TAG: Record<Riwaya, RiwayaTagConfig> = {
  [Riwaya.HAFS_A_ASIM]: { label: "Hafs", backgroundColor: "#2E7D32" },
  [Riwaya.WARSH_AN_NAFI]: { label: "Warsh", backgroundColor: "#1565C0" },
  [Riwaya.QALUN_AN_NAFI]: { label: "Qalun", backgroundColor: "#6A1B9A" },
  [Riwaya.ALDURI_AN_ALKAISSAI]: {
    label: "Ad-Duri",
    backgroundColor: "#EF6C00",
  },
};

const RiwayaTag = ({ riwaya }: RiwayaTagProps) => {
  const { label, backgroundColor } = RIWAYA_TAG[riwaya];

  return (
    <View
      style={{
        position: "absolute",
        top: 8,
        right: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor,
      }}
      accessibilityRole="text"
      accessibilityLabel={`Riwaya ${label}`}
    >
      <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
        {label}
      </Text>
    </View>
  );
};

export default memo(RiwayaTag);
