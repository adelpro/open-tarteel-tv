import { Playlist, Riwaya } from "../../types";
import { Mp3QuranApiMoshaf } from "./mp3quran.types";

export const getRiwayaKeyFromMoshafName = (name: string): Riwaya => {
  const n = name.toLowerCase();

  if (n.includes("warsh") || n.includes("ورش")) return Riwaya.WARSH_AN_NAFI;
  if (n.includes("qalun") || n.includes("قالون")) return Riwaya.QALUN_AN_NAFI;
  if (n.includes("alduri") || n.includes("الدوري"))
    return Riwaya.ALDURI_AN_ALKAISSAI;

  return Riwaya.HAFS_A_ASIM;
};

export const generatePlaylist = (moshaf: Mp3QuranApiMoshaf): Playlist =>
  moshaf.surah_list.split(",").map((id) => ({
    surahId: id,
    link: `${moshaf.server}${id.padStart(3, "0")}.mp3`,
  }));
