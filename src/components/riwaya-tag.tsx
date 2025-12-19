import React, { memo } from "react";
import { Text, View } from "react-native";
import { Riwaya } from "../types";
import { useTranslation } from "react-i18next";

type RiwayaTagProps = {
  riwaya: Riwaya;
};

type RiwayaTagConfig = {
  label: string;
  backgroundColor: string;
};

const RiwayaTag = ({ riwaya }: RiwayaTagProps) => {
  const { t, i18n } = useTranslation();

  const RIWAYA_TAG: Record<Riwaya, RiwayaTagConfig> = {
    [Riwaya.HAFS_A_ASIM]: {
      label: t("riwaya.hafs"),
      backgroundColor: "#2E7D32",
    },
    [Riwaya.WARSH_AN_NAFI]: {
      label: t("riwaya.warsh"),
      backgroundColor: "#1565C0",
    },
    [Riwaya.QALUN_AN_NAFI]: {
      label: t("riwaya.qalun"),
      backgroundColor: "#6A1B9A",
    },
    [Riwaya.ALDURI_AN_ALKAISSAI]: {
      label: t("riwaya.alduri"),
      backgroundColor: "#EF6C00",
    },
  };
  const { label, backgroundColor } = RIWAYA_TAG[riwaya];

  const isRTL = i18n.dir() === "rtl";
  return (
    <View
      style={{
        position: "absolute",
        top: 8,
        end: 8,
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
