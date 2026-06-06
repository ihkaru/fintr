import { ref, computed } from "vue";
import { periods } from "../js/api";
import { f7 } from "framework7-vue";

export function useRolloverPreview() {
  const showRolloverSheet = ref(false);
  const loadingPreview = ref(false);
  const previewData = ref<any>(null);
  const closingPeriod = ref(false);

  const previewSummary = computed(() => {
    if (!previewData.value) {
      return {
        totalRemaining: 0,
        toSavings: 0,
        toSelf: 0,
        toReset: 0,
      };
    }

    let totalRemaining = 0;
    let toSavings = 0;
    let toSelf = 0;
    let toReset = 0;

    previewData.value.allocations.forEach((alloc: any) => {
      const remaining = parseFloat(alloc.remaining) || 0;
      totalRemaining += remaining;
      if (alloc.rolloverBehavior === "rollover_to_savings") {
        toSavings += remaining;
      } else if (alloc.rolloverBehavior === "rollover_self") {
        toSelf += remaining;
      } else {
        toReset += remaining;
      }
    });

    return {
      totalRemaining,
      toSavings,
      toSelf,
      toReset,
    };
  });

  const closeActivePeriod = async (activePeriodId: string) => {
    showRolloverSheet.value = true;
    loadingPreview.value = true;
    try {
      const res = await periods.getDetail(activePeriodId);
      previewData.value = res;
    } catch (err: any) {
      f7.dialog.alert("Gagal memuat pratinjau rollover: " + err.message);
      showRolloverSheet.value = false;
    } finally {
      loadingPreview.value = false;
    }
  };

  const confirmClosePeriod = async (
    activePeriodId: string,
    options: { fastForward: boolean },
    onSuccess?: () => void
  ) => {
    closingPeriod.value = true;
    try {
      await periods.close(activePeriodId, { fastForward: options.fastForward });
      showRolloverSheet.value = false;
      f7.dialog.alert(
        "Periode berhasil ditutup dan rollover selesai! Periode baru telah dibuka secara otomatis.",
        "Sukses"
      );
      if (onSuccess) onSuccess();
    } catch (err: any) {
      f7.dialog.alert("Gagal melakukan rollover: " + err.message);
    } finally {
      closingPeriod.value = false;
    }
  };

  return {
    showRolloverSheet,
    loadingPreview,
    previewData,
    previewSummary,
    closingPeriod,
    closeActivePeriod,
    confirmClosePeriod,
  };
}
