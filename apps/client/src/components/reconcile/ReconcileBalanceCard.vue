<template>
  <div
    class="animate-in"
    style="
      background: #ffffff;
      border: 1px solid #bfc9c1;
      border-radius: 20px;
      padding: 24px 20px;
      margin-bottom: 20px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
    "
  >
    <div
      style="
        font-size: 13px;
        color: var(--fintr-text-muted);
        margin-bottom: 4px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      "
    >
      Saldo Tercatat di FamiVault
    </div>
    <div
      class="font-headline"
      style="
        font-size: 30px;
        font-weight: 800;
        color: #0f5238;
        letter-spacing: -0.02em;
        margin-bottom: 20px;
      "
    >
      {{ formatRp(reconcileDiff?.expectedBalance || 0) }}
    </div>

    <div
      style="
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        margin-bottom: 10px;
        border-bottom: 1px dashed #bfc9c1;
        padding-bottom: 10px;
      "
    >
      <span style="color: var(--fintr-text-muted)">Saldo Awal Periode:</span>
      <span style="font-weight: 700; color: #161a32">{{
        formatRp(reconcileDiff?.openingBalance || 0)
      }}</span>
    </div>
    <div style="display: flex; justify-content: space-between; font-size: 13px">
      <span style="color: var(--fintr-text-muted)">Total Pengeluaran:</span>
      <span style="font-weight: 700; color: var(--fintr-danger)">
        -{{ formatRp(reconcileDiff?.totalSpent || 0) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatRp } from "../../js/routes";

defineProps<{
  reconcileDiff: any;
}>();
</script>
