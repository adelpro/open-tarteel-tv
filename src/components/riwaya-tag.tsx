import React, { memo } from 'react';
import { Text, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { Riwaya } from '../types';

type RiwayaTagProps = {
  riwaya: Riwaya;
};

type RiwayaTagConfig = {
  label: string;
  backgroundColor: string;
};

const RiwayaTag = ({ riwaya }: RiwayaTagProps) => {
  const { t } = useTranslation();

  const RIWAYA_TAG: Record<Riwaya, RiwayaTagConfig> = {
    [Riwaya.HAFS_A_ASIM]: {
      label: t('riwaya.hafs'),
      backgroundColor: '#2E7D32',
    },
    [Riwaya.WARSH_AN_NAFI]: {
      label: t('riwaya.warsh'),
      backgroundColor: '#1565C0',
    },
    [Riwaya.QALUN_AN_NAFI]: {
      label: t('riwaya.qalun'),
      backgroundColor: '#6A1B9A',
    },
    [Riwaya.ALDURI_AN_ALKAISSAI]: {
      label: t('riwaya.alduri'),
      backgroundColor: '#EF6C00',
    },
    [Riwaya.KHALAF_AN_HAMZAH]: {
      label: t('riwaya.khalaf'),
      backgroundColor: '#00838F',
    },
    [Riwaya.AL_BAZZI_AN_IBN_KATHIR]: {
      label: t('riwaya.alBazzi'),
      backgroundColor: '#C62828',
    },
    [Riwaya.AL_SOOSI_AN_ABU_AMR]: {
      label: t('riwaya.alSoosi'),
      backgroundColor: '#4527A0',
    },
    [Riwaya.AL_DOORI_AN_ABU_AMR]: {
      label: t('riwaya.alDooriAbuAmr'),
      backgroundColor: '#AD1457',
    },
    [Riwaya.SHUABA_AN_ASIM]: {
      label: t('riwaya.shuaba'),
      backgroundColor: '#283593',
    },
    [Riwaya.IBN_ZAKWAN]: {
      label: t('riwaya.ibnZakwan'),
      backgroundColor: '#558B2F',
    },
    [Riwaya.HISHAM]: {
      label: t('riwaya.hisham'),
      backgroundColor: '#D84315',
    },
    [Riwaya.IBN_JAMMAZ]: {
      label: t('riwaya.ibnJammaz'),
      backgroundColor: '#4E342E',
    },
    [Riwaya.YAQOUB]: {
      label: t('riwaya.yaqoub'),
      backgroundColor: '#37474F',
    },
  };
  const { label, backgroundColor } = RIWAYA_TAG[riwaya];

  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        height: 20,
        backgroundColor,
      }}
      accessibilityRole="text"
      accessibilityLabel={`Riwaya ${label}`}
    >
      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
        {label}
      </Text>
    </View>
  );
};

export default memo(RiwayaTag);
