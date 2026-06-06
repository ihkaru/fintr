import { ref, reactive } from "vue";
import { periods, PeriodDetail } from "../js/api";

export function useTransactionForm(routeQueryAllocId?: string) {
  const loadingEnvelopes = ref(true);
  const allocations = ref<PeriodDetail["allocations"]>([]);
  const currentPeriodId = ref<string>("");
  const aiRecommendationText = ref("");

  const form = reactive({
    amount: "" as number | "",
    merchant: "",
    note: "",
    date: "",
    source: "manual" as "manual" | "ocr",
    allocationId: "" as string,
    rawImageKey: "",
  });

  const setSource = (src: "manual" | "ocr") => {
    form.source = src;
  };

  const selectEnvelope = (id: string) => {
    form.allocationId = id;
  };

  const initDateTime = () => {
    const local = new Date();
    local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
    form.date = local.toISOString().slice(0, 16);
  };

  const loadEnvelopes = async (alertCallback: (msg: string, title: string) => void) => {
    try {
      const list = await periods.list();
      const current = list.find(p => !p.isClosed);
      if (!current) {
        alertCallback("Belum ada periode anggaran aktif. Buka periode dulu.", "Oops");
        return;
      }

      currentPeriodId.value = current.id;
      const detail = await periods.getDetail(current.id);
      // Filter out deactivated/soft-deleted allocations
      allocations.value = detail.allocations.filter(a => a.isActive !== false);

      if (routeQueryAllocId) {
        const found = allocations.value.find(a => a.id === routeQueryAllocId);
        if (found) {
          form.allocationId = routeQueryAllocId;
        } else if (allocations.value.length > 0) {
          form.allocationId = allocations.value[0].id;
        }
      } else if (allocations.value.length > 0) {
        form.allocationId = allocations.value[0].id;
      }
    } catch (err: any) {
      console.error("Gagal memuat amplop:", err);
    } finally {
      loadingEnvelopes.value = false;
    }
  };

  return {
    loadingEnvelopes,
    allocations,
    currentPeriodId,
    aiRecommendationText,
    form,
    setSource,
    selectEnvelope,
    initDateTime,
    loadEnvelopes,
  };
}
export type UseTransactionFormReturn = ReturnType<typeof useTransactionForm>;
