import { ref, reactive } from "vue";
import { f7 } from "framework7-vue";
import { reconcile } from "../js/api";

export function useReconcile(f7router: any) {
  const loading = ref(true);
  const submitting = ref(false);
  const reconcileDiff = ref<any>(null);
  const historyList = ref<any[]>([]);
  const computedDiff = ref(0);

  const form = reactive({
    actualBalance: "" as number | "",
    note: "",
  });

  const showCalculator = ref(false);
  const wallets = ref<Array<{ label: string; amount: number | "" }>>([
    { label: "Tabungan Utama", amount: "" },
    { label: "Dompet Tunai", amount: "" },
    { label: "E-Wallet/QRIS", amount: "" },
  ]);
  const autoNoteEnabled = ref(true);
  const calculatorTotal = ref(0);
  const expandedSnapshots = ref<Record<string, boolean>>({});

  let initialBalance: number | "" = "";
  const initialNote = "";

  const toggleCalculator = () => {
    showCalculator.value = !showCalculator.value;
  };

  const addWallet = () => {
    wallets.value.push({ label: "", amount: "" });
  };

  const removeWallet = (index: number) => {
    wallets.value.splice(index, 1);
    syncCalculator();
  };

  const formatRpShort = (val: number) => {
    if (val >= 1000000) {
      const jt = val / 1000000;
      return `${jt % 1 === 0 ? jt : jt.toFixed(1)}jt`;
    }
    if (val >= 1000) {
      const rb = val / 1000;
      return `${rb % 1 === 0 ? rb : rb.toFixed(1)}rb`;
    }
    return val.toString();
  };

  const updateAutoNote = () => {
    if (!autoNoteEnabled.value) return;
    const activeWallets = wallets.value.filter(w => w.amount !== "" && Number(w.amount) > 0);
    if (activeWallets.length === 0) {
      form.note = "";
      return;
    }
    const details = activeWallets
      .map(w => `${w.label || "Lainnya"}: ${formatRpShort(Number(w.amount))}`)
      .join(", ");
    form.note = `Rincian: ${details}`;
  };

  const calculateDiff = () => {
    if (form.actualBalance === "" || !reconcileDiff.value) {
      computedDiff.value = 0;
      return;
    }
    const expected = parseFloat(reconcileDiff.value.expectedBalance || "0");
    computedDiff.value = Number(form.actualBalance) - expected;
  };

  const syncCalculator = () => {
    let total = 0;
    wallets.value.forEach(w => {
      if (w.amount !== "" && !isNaN(w.amount)) {
        total += Number(w.amount);
      }
    });
    calculatorTotal.value = total;
    form.actualBalance = total > 0 ? total : "";
    calculateDiff();
    updateAutoNote();
  };

  const handleActualBalanceInput = () => {
    calculateDiff();
    if (showCalculator.value) {
      wallets.value.forEach(w => {
        w.amount = "";
      });
      calculatorTotal.value = 0;
    }
  };

  const toggleExpandSnapshot = (id: string) => {
    expandedSnapshots.value[id] = !expandedSnapshots.value[id];
  };

  const parseNoteDetails = (note: string | null) => {
    if (!note) return null;
    if (!note.startsWith("Rincian:")) return null;

    const cleanStr = note.substring("Rincian:".length).trim();
    const parts = cleanStr.split(",");
    return parts.map(p => {
      const lastColonIdx = p.lastIndexOf(":");
      if (lastColonIdx === -1) return { label: p.trim(), value: "" };
      return {
        label: p.substring(0, lastColonIdx).trim(),
        value: p.substring(lastColonIdx + 1).trim(),
      };
    });
  };

  const loadReconcileData = async () => {
    try {
      const [diff, history] = await Promise.all([reconcile.diff(), reconcile.history()]);
      reconcileDiff.value = diff;
      historyList.value = history;
      if (diff.actualBalance) {
        form.actualBalance = parseFloat(diff.actualBalance);
        initialBalance = form.actualBalance;
        calculateDiff();
      } else {
        form.actualBalance = "";
        initialBalance = "";
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      loading.value = false;
    }
  };

  const submitSnapshot = async () => {
    if (form.actualBalance === "") {
      f7.dialog.alert("Masukkan nilai saldo aktual", "Oops");
      return;
    }

    submitting.value = true;
    try {
      await reconcile.snapshot({
        actualBalance: Number(form.actualBalance),
        note: form.note || undefined,
      });
      f7.toast
        .create({
          text: "Snapshot saldo berhasil disimpan! 📊",
          closeTimeout: 2000,
        })
        .open();
      form.note = "";
      wallets.value.forEach(w => {
        w.amount = "";
      });
      calculatorTotal.value = 0;
      showCalculator.value = false;
      loadReconcileData();
    } catch (err: any) {
      f7.dialog.alert("Gagal menyimpan: " + err.message);
    } finally {
      submitting.value = false;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isDirty = () => {
    return form.actualBalance !== initialBalance || form.note !== initialNote;
  };

  const handleNavbarBack = () => {
    if (isDirty()) {
      f7.dialog.confirm(
        "Ada perubahan belum disimpan. Batalkan rekonsiliasi?",
        "Batal Rekonsiliasi?",
        () => {
          f7router.back();
        }
      );
    } else {
      f7router.back();
    }
  };

  return {
    loading,
    submitting,
    reconcileDiff,
    historyList,
    computedDiff,
    form,
    showCalculator,
    wallets,
    autoNoteEnabled,
    calculatorTotal,
    expandedSnapshots,
    toggleCalculator,
    addWallet,
    removeWallet,
    syncCalculator,
    handleActualBalanceInput,
    toggleExpandSnapshot,
    parseNoteDetails,
    loadReconcileData,
    submitSnapshot,
    formatDate,
    isDirty,
    handleNavbarBack,
  };
}
