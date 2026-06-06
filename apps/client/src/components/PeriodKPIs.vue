<template>
  <div>
    <!-- KPI Metrics Row -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px">
      <div
        style="
          background: white;
          border: 1px solid #bfc9c1;
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.01);
        "
      >
        <div style="font-size: 11px; color: #707973; font-weight: 600; text-transform: uppercase">
          Sisa Anggaran Rata-rata
        </div>
        <div
          style="
            font-size: 18px;
            font-weight: 800;
            color: #0f5238;
            margin: 4px 0;
            font-family: Manrope, sans-serif;
          "
        >
          {{ formatRp(averageSaving) }}
        </div>
        <div style="font-size: 11px; color: #707973">Sisa anggaran kumulatif per periode</div>
      </div>
      <div
        style="
          background: white;
          border: 1px solid #bfc9c1;
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.01);
        "
      >
        <div style="font-size: 11px; color: #707973; font-weight: 600; text-transform: uppercase">
          Sisa Anggaran (%)
        </div>
        <div
          style="
            font-size: 18px;
            font-weight: 800;
            color: #485f84;
            margin: 4px 0;
            font-family: Manrope, sans-serif;
          "
        >
          {{ savingRatePct }}%
        </div>
        <div
          style="
            font-size: 11px;
            color: #485f84;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 4px;
          "
        >
          <span style="font-size: 12px">🛡️</span> Persentase Dana Tersisa
        </div>
      </div>
    </div>

    <!-- Household context info for newlyweds -->
    <div
      style="
        background: rgba(15, 82, 56, 0.05);
        border: 1px dashed #0f5238;
        border-radius: 16px;
        padding: 16px;
        margin-bottom: 20px;
        display: flex;
        gap: 12px;
        align-items: flex-start;
      "
    >
      <span style="font-size: 20px; line-height: 1">💡</span>
      <div style="font-size: 12.5px; color: #0f5238; line-height: 1.5">
        <strong>Tips Keuangan Keluarga Baru:</strong> Dengan penghasilan bulanan 7.8 juta, target
        Tabungan wajib 2 juta langsung diamankan di awal bulan. Riwayat anggaran di atas membantu
        memantau konsistensi amplop belanja Anda berdua.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatRp } from "../js/routes";

defineProps<{
  averageSaving: number;
  savingRatePct: number;
}>();
</script>
