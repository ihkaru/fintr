<template>
  <div
    style="
      margin: 0 16px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #ffffff;
      border: 1px solid #bfc9c1;
      border-radius: 16px;
      padding: 12px 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.01);
    "
  >
    <div style="display: flex; align-items: center; gap: 12px">
      <span style="font-size: 20px">📊</span>
      <div>
        <div style="font-size: 13px; font-weight: 700; color: #161a32">
          Analisis & Tren Anggaran
        </div>
        <div style="font-size: 11px; color: #707973">Lihat riwayat perbandingan antar periode</div>
      </div>
    </div>
    <f7-link
      href="/period-summary/"
      style="
        font-size: 12px;
        font-weight: 700;
        color: #0f5238;
        border: 1px solid #0f5238;
        padding: 4px 12px;
        border-radius: 8px;
      "
    >
      Buka
    </f7-link>
  </div>
</template>

<script setup lang="ts">
import { f7Link } from "framework7-vue";
</script>
