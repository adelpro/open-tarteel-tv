import { Riwaya } from '../types';

type RiwayaLocale = 'ar' | 'en';
type RiwayaMatchMap = Partial<Record<Riwaya, string[]>>;

// Ported from adelpro/open-tarteel@develop:src/utils/get-riwaya-from-mushaf.ts.
// Keys are TV Riwaya slugs; the web enum's AlDooriKisai is the pre-existing
// ALDURI_AN_ALKAISSAI (there is deliberately no second Kisai member).
//
// Each entry keeps the original full phrase first, then adds the short/Latin
// names the providers actually return (mp3quran v4 riwayah codes, Qurani.ai
// edition names and Quran Foundation qirat names). The five riwayas that had
// an empty English array now carry their providers' Latin names.
const riwayaMatchPhrases: Record<RiwayaLocale, RiwayaMatchMap> = {
  ar: {
    [Riwaya.HAFS_A_ASIM]: ['حفص عن عاصم', 'حفص'],
    [Riwaya.WARSH_AN_NAFI]: ['ورش عن نافع', 'ورش'],
    [Riwaya.KHALAF_AN_HAMZAH]: ['خلف عن حمزة', 'خلف'],
    [Riwaya.AL_BAZZI_AN_IBN_KATHIR]: ['البزي عن ابن كثير', 'البزي', 'ابن كثير'],
    [Riwaya.QALUN_AN_NAFI]: ['قالون عن نافع', 'قالون'],
    [Riwaya.AL_SOOSI_AN_ABU_AMR]: ['السوسي عن أبي عمرو', 'السوسي'],
    // Kisai must be checked before the other "Duri" so "الدوري عن الكسائي"
    // cannot be captured by the Abu Amr alias.
    [Riwaya.ALDURI_AN_ALKAISSAI]: ['الدوري عن الكسائي', 'الكسائي'],
    [Riwaya.AL_DOORI_AN_ABU_AMR]: ['الدوري عن أبي عمرو', 'الدوري'],
    [Riwaya.SHUABA_AN_ASIM]: ['شعبة عن عاصم', 'شعبة'],
    [Riwaya.IBN_ZAKWAN]: ['ابن ذكوان عن ابن عامر', 'ابن ذكوان'],
    [Riwaya.HISHAM]: ['هشام عن ابي عامر', 'هشام'],
    [Riwaya.IBN_JAMMAZ]: ['ابن جماز عن أبي جعفر', 'ابن جماز'],
    [Riwaya.YAQOUB]: ['يعقوب الحضرمي', 'يعقوب'],
  },
  en: {
    [Riwaya.HAFS_A_ASIM]: ["Hafs A'n Assem", 'Hafs'],
    [Riwaya.WARSH_AN_NAFI]: ["Warsh A'n Nafi'", 'Warsh'],
    [Riwaya.KHALAF_AN_HAMZAH]: ['Khalaf an Hamzah', 'Khalaf'],
    [Riwaya.AL_BAZZI_AN_IBN_KATHIR]: [
      "Albizi and Qunbol A'n Ibn Katheer",
      'Albizi',
      'Bazzi',
      'Qunbul',
      'Qunbol',
    ],
    [Riwaya.QALUN_AN_NAFI]: ["Qalon A'n Nafi'", 'Qalun', 'Qalon'],
    [Riwaya.AL_SOOSI_AN_ABU_AMR]: [
      'Susi an Abi Amr',
      'Susi',
      'Al-Susi',
      'Soosi',
      'Sousi',
    ],
    // Order matters: "AlDorai A'n Al-Kisa'ai" must hit Kisai before the
    // generic "Dori/Duri" aliases of the Abu Amr riwaya below.
    [Riwaya.ALDURI_AN_ALKAISSAI]: [
      "AlDorai A'n Al-Kisa'ai",
      'Al-Kisai',
      'Kisai',
      "Kisa'ai",
      'Kisa',
    ],
    [Riwaya.AL_DOORI_AN_ABU_AMR]: [
      "Aldori A'n Abi Amr",
      'Dori',
      'Duri',
      'Abu Amr',
      'Abi Amr',
    ],
    [Riwaya.SHUABA_AN_ASIM]: [
      "Sho'bah A'n Asim",
      "Shu'ba",
      'Shuaba',
      'Shubah',
      "Sho'bah",
    ],
    [Riwaya.IBN_ZAKWAN]: [
      "Ibn Thakwan A'n Ibn Amer",
      'Ibn Zakwan',
      'Ibn Thakwan',
      'Zakwan',
    ],
    [Riwaya.HISHAM]: ['Hisham an Ibn Amir', 'Hisham'],
    [Riwaya.IBN_JAMMAZ]: ['Ibn Jammaz an Abu Jafar', 'Ibn Jammaz', 'Jammaz'],
    [Riwaya.YAQOUB]: [
      'Yaqoub al-Hadrami',
      'Yaqoub',
      'Yaqub',
      'Hadrami',
      'Rawh an Yaqub',
      'Ruways an Yaqub',
    ],
  },
};

export const getRiwayaKeyFromMoshafName = (
  name: string,
  lang: RiwayaLocale = 'ar',
): Riwaya => {
  const map = riwayaMatchPhrases[lang] ?? riwayaMatchPhrases.ar;
  const normalized = name.toLowerCase();

  for (const [riwaya, phrases] of Object.entries(map)) {
    if (phrases.some((phrase) => normalized.includes(phrase.toLowerCase()))) {
      return riwaya as Riwaya;
    }
  }

  return Riwaya.HAFS_A_ASIM;
};
