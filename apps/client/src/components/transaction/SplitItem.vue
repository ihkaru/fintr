<template>
  <div
    style="
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 8px;
      background: #fafafa;
      border: 1px solid #eef2ef;
      border-radius: 8px;
      width: 100%;
      box-sizing: border-box;
    "
  >
    <!-- Item Label / Name Input -->
    <div v-if="note !== undefined" style="display: flex; width: 100%">
      <input
        type="text"
        :value="note"
        @input="onNoteInput"
        placeholder="Nama barang / catatan item (opsional)"
        style="
          flex: 1;
          border: none;
          border-bottom: 1px dashed #bfc9c1;
          background: transparent;
          font-size: 12px;
          font-weight: 600;
          color: #555868;
          padding: 2px 4px;
          outline: none;
          box-sizing: border-box;
        "
      />
    </div>

    <!-- Dropdown, Amount Input, and Delete Button -->
    <div style="display: flex; gap: 8px; align-items: center; width: 100%; box-sizing: border-box">
      <!-- Select Allocation -->
      <select
        :value="allocationId"
        @change="onAllocationChange"
        style="
          flex: 3;
          min-width: 0;
          padding: 10px;
          border: 1px solid #bfc9c1;
          border-radius: 8px;
          background: #ffffff;
          color: #161a32;
          font-size: 13px;
          height: 40px;
          box-sizing: border-box;
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
          flex: 2;
          min-width: 0;
          padding: 10px;
          border: 1px solid #bfc9c1;
          border-radius: 8px;
          font-size: 13px;
          height: 40px;
          box-sizing: border-box;
        "
      />

      <!-- Delete Row Button -->
      <button
        type="button"
        @click="emit('remove')"
        style="
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ffebd9;
          border: none;
          border-radius: 8px;
          color: #e46a11;
          cursor: pointer;
          padding: 0;
          box-sizing: border-box;
        "
      >
        <span class="material-symbols-outlined" style="font-size: 20px">delete</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatRp } from "../../js/routes";

defineProps<{
  allocationId: string;
  amount: number | "";
  note?: string;
  allocations: Array<{
    id: string;
    envelopeName: string;
    remaining: number | string;
  }>;
}>();

const emit = defineEmits<{
  (e: "update:allocationId", val: string): void;
  (e: "update:amount", val: number | ""): void;
  (e: "update:note", val: string): void;
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

const onNoteInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  emit("update:note", target.value);
};
</script>
