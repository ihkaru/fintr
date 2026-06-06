import { ref, reactive } from "vue";
import { f7 } from "framework7-vue";
import { envelopes } from "../js/api";
import type { Transaction, PeriodDetail } from "../js/api";

export function useNudge(currentPeriodId: { value: string | null }) {
  const isNudgeActive = ref(false);
  const suggestedEnvelopeName = ref("Jajan");
  const nudgeSheetOpened = ref(false);
  const creatingNudgeEnvelope = ref(false);

  const nudgeColorPresets = [
    "#6366f1", // Indigo
    "#ec4899", // Pink
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#06b6d4", // Cyan
    "#8b5cf6", // Purple
    "#ef4444", // Red
    "#14b8a6", // Teal
  ];

  const nudgeEnvelopeForm = reactive({
    name: "",
    defaultAmount: "" as number | "",
    color: nudgeColorPresets[0],
    rolloverBehavior: "reset",
  });

  const getSuggestedName = (txns: Transaction[]): string => {
    const counts: Record<string, number> = {};
    for (const t of txns) {
      const rawVal = (t.note && t.note.trim()) || (t.merchant && t.merchant.trim()) || "";
      const val = rawVal.trim().toLowerCase();
      if (!val) continue;
      counts[val] = (counts[val] || 0) + 1;
    }
    let maxCount = 0;
    let popular = "Jajan";
    for (const val in counts) {
      if (counts[val] > maxCount) {
        maxCount = counts[val];
        popular = val
          .split(" ")
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
      }
    }
    return popular;
  };

  const dismissNudge = () => {
    if (currentPeriodId.value) {
      localStorage.setItem(`fintr:nudge-dismissed:${currentPeriodId.value}`, "true");
    }
    isNudgeActive.value = false;
  };

  const openNudgeEnvelopeSheet = () => {
    nudgeEnvelopeForm.name = suggestedEnvelopeName.value;
    nudgeEnvelopeForm.defaultAmount = "";
    nudgeEnvelopeForm.color = nudgeColorPresets[0];
    nudgeEnvelopeForm.rolloverBehavior = "reset";
    nudgeSheetOpened.value = true;
  };

  const friendlyError = (msg?: string) => {
    if (!msg) return "Terjadi kesalahan tidak diketahui.";
    if (msg.includes("PERIOD_CLOSED")) {
      return "Periode anggaran bulan tersebut sudah ditutup.";
    }
    if (msg.includes("Kategori amplop asal tidak ditemukan") || msg.includes("tidak aktif")) {
      return "Kategori amplop yang dipilih sudah dihapus atau tidak aktif.";
    }
    if (msg.includes("OVER_BUDGET")) {
      return "Saldo amplop tidak mencukupi untuk nominal pengeluaran ini.";
    }
    return msg;
  };

  const handleCreateNudgeEnvelope = async () => {
    if (!nudgeEnvelopeForm.name.trim()) {
      f7.dialog.alert("Nama amplop tidak boleh kosong.", "Validasi Gagal");
      return;
    }
    creatingNudgeEnvelope.value = true;
    try {
      await envelopes.create({
        name: nudgeEnvelopeForm.name.trim(),
        defaultAmount: Number(nudgeEnvelopeForm.defaultAmount || 0),
        color: nudgeEnvelopeForm.color,
        rolloverBehavior: nudgeEnvelopeForm.rolloverBehavior,
      });
      f7.toast
        .create({
          text: `Amplop "${nudgeEnvelopeForm.name}" berhasil dibuat! ✉️`,
          closeTimeout: 2000,
        })
        .open();

      // Deactivate nudge
      if (currentPeriodId.value) {
        localStorage.setItem(`fintr:nudge-dismissed:${currentPeriodId.value}`, "true");
      }
      isNudgeActive.value = false;
      nudgeSheetOpened.value = false;

      // Dispatch event to refresh and trigger loadDashboard
      window.dispatchEvent(new CustomEvent("fintr:envelope-changed"));
    } catch (err: any) {
      f7.dialog.alert(friendlyError(err?.message || err), "Gagal Membuat Amplop");
    } finally {
      creatingNudgeEnvelope.value = false;
    }
  };

  const checkNudge = (
    currentPeriod: { createdAt: string | null; id: string },
    allocations: PeriodDetail["allocations"],
    txns: Transaction[]
  ) => {
    isNudgeActive.value = false;
    const ageInDays =
      (new Date().getTime() -
        new Date(currentPeriod.createdAt || new Date().toISOString()).getTime()) /
      (1000 * 60 * 60 * 24);
    if (txns.length >= 10 && ageInDays >= 7) {
      const lainLain = allocations.find((a: any) =>
        ["lain-lain", "lain lain", "miscellaneous", "misc"].includes(a.envelopeName.toLowerCase())
      );
      if (lainLain) {
        const totalSpent = allocations.reduce(
          (sum: number, a: any) => sum + parseFloat(a.totalSpent || "0"),
          0
        );
        const lainLainSpent = parseFloat(lainLain.totalSpent || "0");
        if (totalSpent > 0 && lainLainSpent / totalSpent > 0.6) {
          const dismissalKey = `fintr:nudge-dismissed:${currentPeriod.id}`;
          if (!localStorage.getItem(dismissalKey)) {
            const lainLainTxns = txns.filter((t: any) =>
              ["lain-lain", "lain lain", "miscellaneous", "misc"].includes(
                t.envelopeName.toLowerCase()
              )
            );
            suggestedEnvelopeName.value = getSuggestedName(lainLainTxns);
            isNudgeActive.value = true;
          }
        }
      }
    }
  };

  return {
    isNudgeActive,
    suggestedEnvelopeName,
    nudgeSheetOpened,
    creatingNudgeEnvelope,
    nudgeColorPresets,
    nudgeEnvelopeForm,
    dismissNudge,
    openNudgeEnvelopeSheet,
    handleCreateNudgeEnvelope,
    checkNudge,
  };
}
