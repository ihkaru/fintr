export const getEnvelopeEmoji = (name: string): string => {
  const clean = name.toLowerCase();
  if (
    clean.includes("makan") ||
    clean.includes("dapur") ||
    clean.includes("kuliner") ||
    clean.includes("jajan") ||
    clean.includes("kopi")
  ) {
    return "🍜";
  }
  if (
    clean.includes("sehat") ||
    clean.includes("obat") ||
    clean.includes("sakit") ||
    clean.includes("dokter") ||
    clean.includes("medis")
  ) {
    return "💊";
  }
  if (
    clean.includes("trans") ||
    clean.includes("bensin") ||
    clean.includes("ojek") ||
    clean.includes("mobil") ||
    clean.includes("motor") ||
    clean.includes("parkir") ||
    clean.includes("tol")
  ) {
    return "🚗";
  }
  if (
    clean.includes("listrik") ||
    clean.includes("air") ||
    clean.includes("pdam") ||
    clean.includes("kuota") ||
    clean.includes("internet") ||
    clean.includes("wifi") ||
    clean.includes("pln")
  ) {
    return "⚡";
  }
  if (
    clean.includes("sosial") ||
    clean.includes("kondangan") ||
    clean.includes("amal") ||
    clean.includes("kado") ||
    clean.includes("sumbangan")
  ) {
    return "🎁";
  }
  if (
    clean.includes("rumah") ||
    clean.includes("bersih") ||
    clean.includes("sabun") ||
    clean.includes("cuci")
  ) {
    return "🏠";
  }
  if (
    clean.includes("tabungan") ||
    clean.includes("darurat") ||
    clean.includes("invest") ||
    clean.includes("emas")
  ) {
    return "🛡️";
  }
  if (
    clean.includes("pribadi") ||
    clean.includes("istri") ||
    clean.includes("suami") ||
    clean.includes("hobi")
  ) {
    return "☕";
  }
  return "💸"; // Default cash icon
};
