<template>
  <div>
    <!-- Calculated Live Diff -->
    <div
      style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: #f3f1e9;
        border-radius: 12px;
        margin-bottom: 16px;
        border: 1px solid #bfc9c1;
      "
    >
      <span style="font-size: 13px; color: var(--fintr-text-muted); font-weight: 600"
        >Selisih Keuangan:</span
      >
      <span
        :style="{
          fontSize: '15px',
          fontWeight: 800,
          color: computedDiff >= 0 ? 'var(--fintr-success)' : 'var(--fintr-danger)',
        }"
      >
        {{ computedDiff >= 0 ? "+" : "" }}{{ formatRp(computedDiff) }}
      </span>
    </div>

    <!-- Dynamic Contextual Guidance -->
    <div
      class="animate-in"
      style="
        padding: 16px;
        border-radius: 12px;
        margin-bottom: 16px;
        font-size: 13px;
        line-height: 1.5;
      "
      :style="{
        background: computedDiff === 0 ? '#e8f5e9' : computedDiff > 0 ? '#e0f2f1' : '#fbe9e7',
        border:
          computedDiff === 0
            ? '1px solid #a5d6a7'
            : computedDiff > 0
              ? '1px solid #80cbc4'
              : '1px solid #ffccbc',
        color: computedDiff === 0 ? '#1b5e20' : computedDiff > 0 ? '#004d40' : '#b71c1c',
      }"
    >
      <div
        style="font-weight: 700; margin-bottom: 6px; display: flex; align-items: center; gap: 6px"
      >
        <span class="material-symbols-outlined" style="font-size: 18px">
          {{ computedDiff === 0 ? "check_circle" : computedDiff > 0 ? "add_circle" : "warning" }}
        </span>
        <span>
          {{
            computedDiff === 0
              ? "Catatan Seimbang (Perfect Match)"
              : computedDiff > 0
                ? "Kelebihan Saldo Aktual (+)"
                : "Kekurangan Saldo Aktual (-)"
          }}
        </span>
      </div>
      <div>
        {{
          computedDiff === 0
            ? "Hebat! Saldo riil Anda persis sama dengan pencatatan di FamiVault. Tidak ada selisih yang perlu disesuaikan."
            : computedDiff > 0
              ? "Uang fisik lebih besar dari catatan digital. Ini biasanya karena ada pemasukan/kembalian yang belum dicatat, atau pengeluaran yang dicatat terlalu besar. Periksa riwayat mutasi bank Anda."
              : "Uang fisik kurang dari catatan digital. Ini terjadi karena ada pengeluaran kecil (seperti parkir/kembalian kurang) yang lupa dicatat, atau ada transaksi offline yang belum terunggah. Catat transaksi penyesuaian jika selisih tidak ditemukan."
        }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatRp } from "../../js/routes";

defineProps<{
  computedDiff: number;
}>();
</script>
