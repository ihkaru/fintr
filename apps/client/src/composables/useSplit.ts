import { ref, computed, Ref } from "vue";

export interface SplitItemState {
  allocationId: string;
  amount: number | "";
}

export function useSplit(
  formAmount: Ref<number | ""> | (() => number | ""),
  formAllocationId: Ref<string>
) {
  const isSplit = ref(false);
  const splitItems = ref<SplitItemState[]>([]);

  const splitTotal = computed(() => {
    return splitItems.value.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  });

  const splitRemaining = computed(() => {
    const total = typeof formAmount === "function" ? formAmount() : formAmount.value;
    return (Number(total) || 0) - splitTotal.value;
  });

  const toggleSplit = (allocations: Array<{ id: string }>) => {
    isSplit.value = !isSplit.value;
    const currentAmount = typeof formAmount === "function" ? formAmount() : formAmount.value;
    if (isSplit.value) {
      splitItems.value = [
        {
          allocationId: formAllocationId.value || allocations[0]?.id || "",
          amount: currentAmount ? Math.ceil(Number(currentAmount) * 0.7) : "",
        },
        {
          allocationId: allocations[1]?.id || allocations[0]?.id || "",
          amount: currentAmount ? Math.floor(Number(currentAmount) * 0.3) : "",
        },
      ];
    } else {
      if (splitItems.value.length > 0) {
        formAllocationId.value = splitItems.value[0].allocationId;
      }
    }
  };

  const addSplitItem = (defaultAllocId: string) => {
    splitItems.value.push({
      allocationId: defaultAllocId,
      amount: "",
    });
  };

  const removeSplitItem = (index: number, alertCallback: (msg: string, title: string) => void) => {
    if (splitItems.value.length > 2) {
      splitItems.value.splice(index, 1);
    } else {
      alertCallback("Transaksi terpisah minimal harus terdiri dari 2 amplop.", "Oops");
    }
  };

  return {
    isSplit,
    splitItems,
    splitTotal,
    splitRemaining,
    toggleSplit,
    addSplitItem,
    removeSplitItem,
  };
}
