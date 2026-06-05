<template>
  <div style="display: flex; gap: 8px; align-items: center">
    <!-- Select Allocation -->
    <select
      :value="allocationId"
      @change="onAllocationChange"
      style="
        flex: 2;
        padding: 10px;
        border: 1px solid #bfc9c1;
        border-radius: 8px;
        background: #ffffff;
        color: #161a32;
        font-size: 13px;
      "
    >
      <option value="" disabled>-- Pilih Amplop --</option>
      <option v-for="a in allocations" :key="a.id" :value="a.id">
        {{ a.envelopeName }} ({{ formatRp(a.remaining) }})
      </option>
    </select>

    <!-- Amount Input -->
    <input
      type="number"
      :value="amount"
      @input="onAmountInput"
      placeholder="Nominal"
      style="
        flex: 1.5;
        padding: 10px;
        border: 1px solid #bfc9c1;
        border-radius: 8px;
        font-size: 13px;
        width: 100%;
      "
    />

    <!-- Delete Row Button -->
    <button
      type="button"
      @click="emit('remove')"
      style="
        padding: 10px;
        background: #ffebd9;
        border: none;
        border-radius: 8px;
        color: #e46a11;
        cursor: pointer;
        font-weight: bold;
      "
    >
      🗑️
    </button>
  </div>
</template>

<script setup lang="ts">
import { formatRp } from "../../js/routes";

defineProps<{
  allocationId: string;
  amount: number | "";
  allocations: Array<{
    id: string;
    envelopeName: string;
    remaining: number | string;
  }>;
}>();

const emit = defineEmits<{
  (e: "update:allocationId", val: string): void;
  (e: "update:amount", val: number | ""): void;
  (e: "remove"): void;
}>();

const onAllocationChange = (e: Event) => {
  const target = e.target as HTMLSelectElement;
  emit("update:allocationId", target.value);
};

const onAmountInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const val = target.value === "" ? "" : Number(target.value);
  emit("update:amount", val);
};
</script>
