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

  it('matches bare and mixed-case short names instead of falling back to Hafs', () => {
    expect(getRiwayaKeyFromMoshafName('Qalun', 'en')).toBe(
      Riwaya.QALUN_AN_NAFI,
    );
    expect(getRiwayaKeyFromMoshafName('wArSh', 'en')).toBe(
      Riwaya.WARSH_AN_NAFI,
    );
    expect(getRiwayaKeyFromMoshafName('kHaLaF', 'en')).toBe(
      Riwaya.KHALAF_AN_HAMZAH,
    );
    expect(getRiwayaKeyFromMoshafName('hAfS', 'en')).toBe(Riwaya.HAFS_A_ASIM);
    expect(getRiwayaKeyFromMoshafName('AL-BAZZI', 'en')).toBe(
      Riwaya.AL_BAZZI_AN_IBN_KATHIR,
    );
    expect(getRiwayaKeyFromMoshafName('QUNBUL an ibn kathir', 'en')).toBe(
      Riwaya.AL_BAZZI_AN_IBN_KATHIR,
    );
    expect(getRiwayaKeyFromMoshafName('SuSi', 'en')).toBe(
      Riwaya.AL_SOOSI_AN_ABU_AMR,
    );
    expect(getRiwayaKeyFromMoshafName("SHU'BA", 'en')).toBe(
      Riwaya.SHUABA_AN_ASIM,
    );
    expect(getRiwayaKeyFromMoshafName('Ibn Zakwan', 'en')).toBe(
      Riwaya.IBN_ZAKWAN,
    );
    expect(getRiwayaKeyFromMoshafName('Abu Amr', 'en')).toBe(
      Riwaya.AL_DOORI_AN_ABU_AMR,
    );
  });

  it('recognises Latin names for the five riwayas that had empty English arrays', () => {
    expect(getRiwayaKeyFromMoshafName('Khalaf', 'en')).toBe(
      Riwaya.KHALAF_AN_HAMZAH,
    );
    expect(getRiwayaKeyFromMoshafName('Susi an Abi Amr', 'en')).toBe(
      Riwaya.AL_SOOSI_AN_ABU_AMR,
    );
    expect(getRiwayaKeyFromMoshafName('Hisham an Ibn Amir', 'en')).toBe(
      Riwaya.HISHAM,
    );
    expect(getRiwayaKeyFromMoshafName('Ibn Jammaz', 'en')).toBe(
      Riwaya.IBN_JAMMAZ,
    );
    expect(getRiwayaKeyFromMoshafName('Yaqoub', 'en')).toBe(Riwaya.YAQOUB);
    expect(getRiwayaKeyFromMoshafName('ruways_an_yaqub', 'en')).toBe(
      Riwaya.YAQOUB,
    );
  });

  it('still maps Kisai correctly when bare/mixed-case aliases are used', () => {
    expect(getRiwayaKeyFromMoshafName('al-dori an kisai', 'en')).toBe(
      Riwaya.ALDURI_AN_ALKAISSAI,
    );
    // The Abu Amr "Dori" alias must not swallow a Kisai name.
    expect(getRiwayaKeyFromMoshafName("AlDorai A'n Al-Kisa'ai", 'en')).toBe(
      Riwaya.ALDURI_AN_ALKAISSAI,
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
