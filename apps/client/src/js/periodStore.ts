import { ref } from "vue";
import type { PeriodDetail } from "./api/periods";

const currentPeriodId = ref<string | null>(null);
const allocations = ref<PeriodDetail["allocations"] | null>(null);
const activePeriod = ref<any>(null);

export function usePeriodStore() {
  const setPeriodData = (
    periodId: string,
    allocList: PeriodDetail["allocations"],
    period?: any
  ) => {
    currentPeriodId.value = periodId;
    allocations.value = allocList;
    if (period) {
      activePeriod.value = period;
    }
  };

  const clearPeriodData = () => {
    currentPeriodId.value = null;
    allocations.value = null;
    activePeriod.value = null;
  };

  return {
    currentPeriodId,
    allocations,
    activePeriod,
    setPeriodData,
    clearPeriodData,
  };
}
