import React from 'react';
import { StyleSheet } from 'react-native';

import { useTranslation } from 'react-i18next';
import { SpatialNavigationView } from 'react-tv-space-navigation';

import FilterChip from './filter-chip';
import { Riwaya } from '../types';

type FilterSectionProps = {
  selectedRiwaya: Riwaya | 'all';
  onSelectRiwaya: (riwaya: Riwaya | 'all') => void;
  isRTL: boolean;
};

// Explicit list (rather than Object.values(Riwaya)) so the test catches a
// future Riwaya that was added to the enum but forgotten in the filter row.
export const RIWAYA_FILTER_VALUES: readonly Riwaya[] = [
  Riwaya.HAFS_A_ASIM,
  Riwaya.WARSH_AN_NAFI,
  Riwaya.QALUN_AN_NAFI,
  Riwaya.ALDURI_AN_ALKAISSAI,
  Riwaya.KHALAF_AN_HAMZAH,
  Riwaya.AL_BAZZI_AN_IBN_KATHIR,
  Riwaya.AL_SOOSI_AN_ABU_AMR,
  Riwaya.AL_DOORI_AN_ABU_AMR,
  Riwaya.SHUABA_AN_ASIM,
  Riwaya.IBN_ZAKWAN,
  Riwaya.HISHAM,
  Riwaya.IBN_JAMMAZ,
  Riwaya.YAQOUB,
];

const RIWAYA_LABEL_KEYS: Record<Riwaya, string> = {
  [Riwaya.HAFS_A_ASIM]: 'riwaya.hafs',
  [Riwaya.WARSH_AN_NAFI]: 'riwaya.warsh',
  [Riwaya.QALUN_AN_NAFI]: 'riwaya.qalun',
  [Riwaya.ALDURI_AN_ALKAISSAI]: 'riwaya.alduri',
  [Riwaya.KHALAF_AN_HAMZAH]: 'riwaya.khalaf',
  [Riwaya.AL_BAZZI_AN_IBN_KATHIR]: 'riwaya.alBazzi',
  [Riwaya.AL_SOOSI_AN_ABU_AMR]: 'riwaya.alSoosi',
  [Riwaya.AL_DOORI_AN_ABU_AMR]: 'riwaya.alDooriAbuAmr',
  [Riwaya.SHUABA_AN_ASIM]: 'riwaya.shuaba',
  [Riwaya.IBN_ZAKWAN]: 'riwaya.ibnZakwan',
  [Riwaya.HISHAM]: 'riwaya.hisham',
  [Riwaya.IBN_JAMMAZ]: 'riwaya.ibnJammaz',
  [Riwaya.YAQOUB]: 'riwaya.yaqoub',
};

const SectionFilters = ({
  selectedRiwaya,
  onSelectRiwaya,
  isRTL,
}: FilterSectionProps) => {
  const { t } = useTranslation();

  const styles = StyleSheet.create({
    // Same wrapped layout as the letter filter: all chips stay on screen and
    // remain direct focusable children of the header's navigation tree.
    filterRow: {
      direction: isRTL ? 'rtl' : 'ltr',
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginVertical: 4,
      paddingHorizontal: 20,
    },
  });

  return (
    <SpatialNavigationView direction="horizontal" style={styles.filterRow}>
      <FilterChip
        label={t('filter_all')}
        selected={selectedRiwaya === 'all'}
        onPress={() => onSelectRiwaya('all')}
      />
      {RIWAYA_FILTER_VALUES.map((riwaya) => (
        <FilterChip
          key={riwaya}
          label={t(RIWAYA_LABEL_KEYS[riwaya])}
          selected={selectedRiwaya === riwaya}
          onPress={() => onSelectRiwaya(riwaya)}
        />
      ))}
    </SpatialNavigationView>
  );
};

export default SectionFilters;
