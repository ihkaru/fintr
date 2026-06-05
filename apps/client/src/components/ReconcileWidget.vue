<template>
  <div
    v-if="!reconcileData || reconcileData.status === 'no_snapshot'"
    class="reconcile-widget-empty"
    style="
      margin: 0 16px 24px;
      background: #ffffff;
      border: 1px solid #bfc9c1;
      border-radius: 16px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.01);
    "
  >
    <div style="font-size: 28px; margin-bottom: 8px">⚖️</div>
    <div style="font-size: 14px; font-weight: 700; color: #161a32; margin-bottom: 6px">
      Belum Ada Catatan Saldo Aktual
    </div>
    <div
      style="font-size: 11px; color: #707973; margin-bottom: 16px; line-height: 1.5; padding: 0 8px"
    >
      Mulai rekonsiliasi mingguan untuk mencocokkan saldo tercatat di aplikasi dengan saldo uang
      riil Anda.
    </div>
    <f7-link
      href="/reconcile/"
      style="
        display: inline-block;
        font-size: 12px;
        font-weight: 700;
        color: #0f5238;
        border: 1px solid #0f5238;
        padding: 6px 18px;
        border-radius: 8px;
        transition: all 0.2s ease;
      "
    >
      Update Saldo Sekarang
    </f7-link>
  </div>

  <div
    v-else
    class="reconcile-widget"
    style="
      margin: 0 16px 24px;
      background: white;
      border: 1px solid #bfc9c1;
      border-radius: 16px;
      padding: 16px;
    "
  >
    <div
      class="row"
      style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px"
    >
      <span class="label" style="color: #404943">Saldo Tercatat (Aplikasi)</span>
      <span class="value" style="font-weight: 700; color: #161a32">{{
        formatRp(parseFloat(reconcileData.expectedBalance))
      }}</span>
    </div>
    <div
      class="row"
      style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px"
    >
      <span class="label" style="color: #404943">Saldo Aktual (BRI / Dompet)</span>
      <span class="value" style="font-weight: 700; color: #161a32">{{
        reconcileData.actualBalance
          ? formatRp(parseFloat(reconcileData.actualBalance))
          : "Belum Diupdate"
      }}</span>
    </div>
    <div class="divider" style="height: 1px; background: #bfc9c1; margin: 12px 0"></div>
    <div class="row" style="display: flex; justify-content: space-between; font-size: 13px">
      <span class="label" style="color: #404943; font-weight: 600">Selisih Keuangan</span>
      <span
        :style="{
          fontWeight: '800',
          color: parseFloat(reconcileData.difference || '0') >= 0 ? '#22c55e' : '#ba1a1a',
        }"
      >
        {{ formatRp(parseFloat(reconcileData.difference || "0")) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatRp } from "../js/routes";

defineProps<{
  reconcileData: {
    expectedBalance: string;
    actualBalance: string | null;
    difference: string | null;
    status: string;
  } | null;
}>();
</script>
