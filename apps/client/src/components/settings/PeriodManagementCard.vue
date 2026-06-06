<template>
  <div class="card-glass animate-in" style="margin-bottom: 20px; padding: 20px">
    <div style="font-size: 15px; font-weight: 700; margin-bottom: 8px">Manajemen Periode</div>
    <div style="font-size: 13px; color: var(--fintr-text-muted); margin-bottom: 16px">
      Menutup periode akan memicu sisa dana di semua amplop dialokasikan kembali sesuai pengaturan
      rollover, dan membuka periode baru secara otomatis.
    </div>

    <div v-if="activePeriod" style="margin-bottom: 16px">
      <div style="font-size: 13px; color: var(--fintr-text-muted); margin-bottom: 4px">
        Periode Aktif Saat Ini:
      </div>
      <div style="font-size: 16px; font-weight: 700">
        {{ MONTH_NAMES[activePeriod.month] }} {{ activePeriod.year }}
      </div>
    </div>

    <button
      class="btn-primary"
      style="background: linear-gradient(135deg, var(--fintr-warning), var(--fintr-danger))"
      :disabled="closingPeriod"
      @click="$emit('close-period')"
    >
      {{ closingPeriod ? "Memproses Rollover..." : "Tutup Periode & Rollover 🔁" }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { MONTH_NAMES } from "../../js/routes";

defineProps<{
  activePeriod: any;
  closingPeriod: boolean;
}>();

defineEmits<{
  (e: "close-period"): void;
}>();
</script>
