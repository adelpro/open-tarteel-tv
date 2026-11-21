import { describe, expect, it } from 'vitest';

import { Riwaya } from '../types';
import { getRiwayaKeyFromMoshafName } from './get-riwaya-from-mushaf';

describe('getRiwayaKeyFromMoshafName', () => {
  it('maps Arabic and English Warsh names to WARSH_AN_NAFI', () => {
    expect(getRiwayaKeyFromMoshafName('ورش عن نافع', 'ar')).toBe(
      Riwaya.WARSH_AN_NAFI,
    );
    expect(getRiwayaKeyFromMoshafName("Warsh A'n Nafi'", 'en')).toBe(
      Riwaya.WARSH_AN_NAFI,
    );
  });

  it('defaults Hafs an Aasim and unknown names to HAFS_A_ASIM', () => {
    expect(getRiwayaKeyFromMoshafName('Hafs an Aasim', 'en')).toBe(
      Riwaya.HAFS_A_ASIM,
    );
    expect(getRiwayaKeyFromMoshafName('totally unknown recitation', 'en')).toBe(
      Riwaya.HAFS_A_ASIM,
    );
  });

  it('maps the Kisai dorai to the pre-existing ALDURI_AN_ALKAISSAI', () => {
    expect(getRiwayaKeyFromMoshafName("AlDorai A'n Al-Kisa'ai", 'en')).toBe(
      Riwaya.ALDURI_AN_ALKAISSAI,
    );
  });

  it('maps Abu Amr dorai to the new AL_DOORI_AN_ABU_AMR', () => {
    expect(getRiwayaKeyFromMoshafName('مصحف الدوري عن أبي عمرو', 'ar')).toBe(
      Riwaya.AL_DOORI_AN_ABU_AMR,
    );
  });

  it('supports the English phrase map for newly covered riwayas', () => {
    expect(
      getRiwayaKeyFromMoshafName("Albizi and Qunbol A'n Ibn Katheer", 'en'),
    ).toBe(Riwaya.AL_BAZZI_AN_IBN_KATHIR);
    expect(getRiwayaKeyFromMoshafName("Aldori A'n Abi Amr", 'en')).toBe(
      Riwaya.AL_DOORI_AN_ABU_AMR,
    );
  });

  it('keeps the four pre-existing riwaya slugs unchanged', () => {
    expect(Riwaya.HAFS_A_ASIM).toBe('hafs-a-asim');
    expect(Riwaya.WARSH_AN_NAFI).toBe('warsh-an-nafi');
    expect(Riwaya.QALUN_AN_NAFI).toBe('qalun-an-nafi');
    expect(Riwaya.ALDURI_AN_ALKAISSAI).toBe('alduri-an-alkaissai');
  });

  it('exposes 13 riwaya values including the nine new slugs', () => {
    expect(Object.values(Riwaya)).toHaveLength(13);
    expect(Object.values(Riwaya)).toEqual(
      expect.arrayContaining([
        'khalaf-an-hamzah',
        'al-bazzi-an-ibn-kathir',
        'al-soosi-an-abu-amr',
        'al-doori-an-abu-amr',
        'shuaba-an-asim',
        'ibn-zakwan',
        'hisham',
        'ibn-jammaz',
        'yaqoub',
      ]),
    );
  });
});
