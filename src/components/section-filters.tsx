import React from "react";
import { StyleSheet } from "react-native";
import { SpatialNavigationView } from "react-tv-space-navigation";
import FilterChip from "./filter-chip";
import { Riwaya } from "../types";
import { useTranslation } from "react-i18next";

type FilterSectionProps = {
  selectedRiwaya: Riwaya | "all";
  onSelectRiwaya: (riwaya: Riwaya | "all") => void;
  isRTL: boolean;
};

const SectionFilters = ({
  selectedRiwaya,
  onSelectRiwaya,
  isRTL,
}: FilterSectionProps) => {
  const { t } = useTranslation();

  const styles = StyleSheet.create({
    filterRow: {
      flexDirection: "row",
      direction: isRTL ? "rtl" : "ltr",
      alignItems: "center",
      justifyContent: "flex-start",
      flexWrap: "wrap",
      marginVertical: 12,
    },
  });

  return (
    <SpatialNavigationView direction="horizontal" style={styles.filterRow}>
      <FilterChip
        label={t("filter_all")}
        selected={selectedRiwaya === "all"}
        onPress={() => onSelectRiwaya("all")}
      />
      <FilterChip
        label={t("filter_hafs")}
        selected={selectedRiwaya === Riwaya.HAFS_A_ASIM}
        onPress={() => onSelectRiwaya(Riwaya.HAFS_A_ASIM)}
      />
      <FilterChip
        label={t("filter_warsh")}
        selected={selectedRiwaya === Riwaya.WARSH_AN_NAFI}
        onPress={() => onSelectRiwaya(Riwaya.WARSH_AN_NAFI)}
      />
      <FilterChip
        label={t("filter_qalun")}
        selected={selectedRiwaya === Riwaya.QALUN_AN_NAFI}
        onPress={() => onSelectRiwaya(Riwaya.QALUN_AN_NAFI)}
      />
      <FilterChip
        label={t("filter_ad_duri")}
        selected={selectedRiwaya === Riwaya.ALDURI_AN_ALKAISSAI}
        onPress={() => onSelectRiwaya(Riwaya.ALDURI_AN_ALKAISSAI)}
      />
    </SpatialNavigationView>
  );
};

export default SectionFilters;
