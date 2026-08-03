import { legacySuccess } from "../compatibility/response.mjs";

export const REJECT_DROP_REASONS = Object.freeze([
  "Ada tim dan aktifitas lain di dalam site",
  "Community case (Comcase)",
  "Cuti",
  "Hujan",
  "Izin",
  "Kunci / padlock issue",
  "Ormas / Preman",
  "Penjaga site tidak bisa dihubungi",
  "Perlu permit baru",
  "Sakit",
  "Salah longlat / longlat bergeser",
  "Sarang lebah / tawon",
  "Site direlokasi (Reloc)",
  "Site dismantle",
  "Time limitation / sudah gelap",
  "Tower design issue",
]);

export async function getRejectDropReasonList() {
  return legacySuccess([...REJECT_DROP_REASONS]);
}
