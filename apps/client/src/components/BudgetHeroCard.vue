<template>
  <div
    class="hero-stats animate-in"
    style="
      margin: 12px 16px;
      background: linear-gradient(135deg, #0f5238, #2d6a4f);
      box-shadow: 0 8px 24px rgba(15, 82, 56, 0.15);
      border-radius: 20px;
      padding: 24px;
      color: white;
    "
  >
    <div
      class="label"
      style="
        font-size: 13px;
        opacity: 0.85;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 600;
      "
    >
      Sisa Dana Teralokasi
    </div>
    <div
      class="value font-headline"
      style="font-size: 32px; font-weight: 800; margin: 4px 0 16px; letter-spacing: -0.03em"
    >
      {{ formatRp(remaining) }}
    </div>
    <div
      class="sub-row"
      style="
        display: flex;
        gap: 24px;
        border-top: 1px solid rgba(255, 255, 255, 0.15);
        padding-top: 16px;
      "
    >
      <div class="sub-item" style="flex: 1">
        <div class="sub-label" style="font-size: 11px; opacity: 0.8">Total Anggaran</div>
        <div class="sub-value font-headline" style="font-size: 15px; font-weight: 700">
          {{ formatRp(allocated) }}
        </div>
      </div>
      <div class="sub-item" style="flex: 1">
        <div class="sub-label" style="font-size: 11px; opacity: 0.8">Terbelanjakan</div>
        <div class="sub-value font-headline" style="font-size: 15px; font-weight: 700">
          {{ formatRp(spent) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatRp } from "../js/routes";

defineProps<{
  remaining: number;
  allocated: number;
  spent: number;
}>();
</script>

<style scoped>
.animate-in {
  animation: fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
