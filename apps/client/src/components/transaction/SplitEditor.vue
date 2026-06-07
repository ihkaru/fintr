<template>
  <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px">
    <SplitItem
      v-for="(item, idx) in splitItems"
      :key="idx"
      :allocation-id="item.allocationId"
      :amount="item.amount"
      :note="item.note"
      :allocations="allocations"
      @update:allocation-id="
        val => emit('update-item', { index: idx, field: 'allocationId', value: val })
      "
      @update:amount="val => emit('update-item', { index: idx, field: 'amount', value: val })"
      @update:note="val => emit('update-item', { index: idx, field: 'note', value: val })"
      @remove="emit('remove-item', idx)"
    />

    <!-- Add Row Button & Balance Box -->
    <div
      style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px"
    >
      <button
        type="button"
        @click="emit('add-item')"
        style="
          padding: 8px 16px;
          background: #f0f4f1;
          border: 1px solid #bfc9c1;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          color: #0f5238;
          cursor: pointer;
        "
      >
        ➕ Tambah Pos Baru
      </button>
      <div
        :style="{
          fontSize: '13px',
          fontWeight: '700',
          color: isSplitBalanced ? '#0f5238' : '#e46a11',
          background: isSplitBalanced ? '#e6f4ea' : '#ffebe6',
          padding: '6px 12px',
          borderRadius: '8px',
          border: `1px solid ${isSplitBalanced ? '#b7e1cd' : '#fad2cf'}`,
        }"
      >
        Selisih: {{ formatRp(splitDiff) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SplitItem from "./SplitItem.vue";
import { formatRp } from "../../js/routes";

defineProps<{
  splitItems: Array<{
    allocationId: string;
    amount: number | "";
    note?: string;
  }>;
  allocations: Array<{
    id: string;
    envelopeName: string;
    remaining: number | string;
  }>;
  isSplitBalanced: boolean;
  splitDiff: number;
}>();

const emit = defineEmits<{
  (
    e: "update-item",
    payload: { index: number; field: "allocationId" | "amount" | "note"; value: any }
  ): void;
  (e: "add-item"): void;
  (e: "remove-item", index: number): void;
}>();
</script>
