import { Riwaya } from '../types';

type RiwayaLocale = 'ar' | 'en';
type RiwayaMatchMap = Partial<Record<Riwaya, string[]>>;

// Ported from adelpro/open-tarteel@develop:src/utils/get-riwaya-from-mushaf.ts.
// Keys are TV Riwaya slugs; the web enum's AlDooriKisai is the pre-existing
// ALDURI_AN_ALKAISSAI (there is deliberately no second Kisai member).
const riwayaMatchPhrases: Record<RiwayaLocale, RiwayaMatchMap> = {
  ar: {
    [Riwaya.HAFS_A_ASIM]: ['حفص عن عاصم'],
    [Riwaya.WARSH_AN_NAFI]: ['ورش عن نافع'],
    [Riwaya.KHALAF_AN_HAMZAH]: ['خلف عن حمزة'],
    [Riwaya.AL_BAZZI_AN_IBN_KATHIR]: ['البزي عن ابن كثير'],
    [Riwaya.QALUN_AN_NAFI]: ['قالون عن نافع'],
    [Riwaya.AL_SOOSI_AN_ABU_AMR]: ['السوسي عن أبي عمرو'],
    [Riwaya.ALDURI_AN_ALKAISSAI]: ['الدوري عن الكسائي'],
    [Riwaya.AL_DOORI_AN_ABU_AMR]: ['الدوري عن أبي عمرو'],
    [Riwaya.SHUABA_AN_ASIM]: ['شعبة عن عاصم'],
    [Riwaya.IBN_ZAKWAN]: ['ابن ذكوان عن ابن عامر'],
    [Riwaya.HISHAM]: ['هشام عن ابي عامر'],
    [Riwaya.IBN_JAMMAZ]: ['ابن جماز عن أبي جعفر'],
    [Riwaya.YAQOUB]: ['يعقوب الحضرمي'],
  },
  en: {
    [Riwaya.HAFS_A_ASIM]: ["Hafs A'n Assem"],
    [Riwaya.WARSH_AN_NAFI]: ["Warsh A'n Nafi'"],
    [Riwaya.KHALAF_AN_HAMZAH]: [],
    [Riwaya.AL_BAZZI_AN_IBN_KATHIR]: ["Albizi and Qunbol A'n Ibn Katheer"],
    [Riwaya.QALUN_AN_NAFI]: ["Qalon A'n Nafi'"],
    [Riwaya.AL_SOOSI_AN_ABU_AMR]: [],
    [Riwaya.ALDURI_AN_ALKAISSAI]: ["AlDorai A'n Al-Kisa'ai"],
    [Riwaya.AL_DOORI_AN_ABU_AMR]: ["Aldori A'n Abi Amr"],
    [Riwaya.SHUABA_AN_ASIM]: ["Sho'bah A'n Asim"],
    [Riwaya.IBN_ZAKWAN]: ["Ibn Thakwan A'n Ibn Amer"],
    [Riwaya.HISHAM]: [],
    [Riwaya.IBN_JAMMAZ]: [],
    [Riwaya.YAQOUB]: [],
  },
};

export const getRiwayaKeyFromMoshafName = (
  name: string,
  lang: RiwayaLocale = 'ar',
): Riwaya => {
  const map = riwayaMatchPhrases[lang] ?? riwayaMatchPhrases.ar;

  for (const [riwaya, phrases] of Object.entries(map)) {
    if (phrases.some((phrase) => name.includes(phrase))) {
      return riwaya as Riwaya;
    }
  }

  return Riwaya.HAFS_A_ASIM;
};
