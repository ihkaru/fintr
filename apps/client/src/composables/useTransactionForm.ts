import { ref, reactive } from "vue";
import { periods, PeriodDetail } from "../js/api";
import { usePeriodStore } from "../js/periodStore";

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
    const {
      currentPeriodId: cachedPeriodId,
      allocations: cachedAllocations,
      setPeriodData,
    } = usePeriodStore();

    const setLocalAllocations = (periodId: string, rawAllocations: PeriodDetail["allocations"]) => {
      currentPeriodId.value = periodId;
      allocations.value = rawAllocations.filter(a => a.isActive !== false);

      if (routeQueryAllocId) {
        const found = allocations.value.find(a => a.id === routeQueryAllocId);
        if (found) {
          form.allocationId = routeQueryAllocId;
        } else if (allocations.value.length > 0 && !form.allocationId) {
          form.allocationId = allocations.value[0].id;
        }
      } else if (allocations.value.length > 0 && !form.allocationId) {
        form.allocationId = allocations.value[0].id;
      }
    };

    // 1. Use cache immediately if available
    if (cachedPeriodId.value && cachedAllocations.value) {
      setLocalAllocations(cachedPeriodId.value, cachedAllocations.value);
      loadingEnvelopes.value = false;
    }

    // 2. Fetch fresh data
    const fetchFresh = async () => {
      try {
        const list = await periods.list();
        const current = list.find(p => !p.isClosed);
        if (!current) {
          if (!cachedPeriodId.value) {
            alertCallback("Belum ada periode anggaran aktif. Buka periode dulu.", "Oops");
          }
          return;
        }

        const detail = await periods.getDetail(current.id);
        setLocalAllocations(current.id, detail.allocations);
        setPeriodData(current.id, detail.allocations, current);
      } catch (err: any) {
        console.error("Gagal memuat amplop:", err);
        if (!cachedPeriodId.value) {
          alertCallback("Gagal memuat amplop dari server.", "Oops");
        }
      } finally {
        loadingEnvelopes.value = false;
      }
    };

    if (cachedPeriodId.value && cachedAllocations.value) {
      // Revalidate in background
      fetchFresh();
    } else {
      // Initial synchronous load
      await fetchFresh();
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
