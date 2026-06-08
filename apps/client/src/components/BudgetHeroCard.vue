<template>
  <div
    class="hero-stats animate-in"
    :class="{ 'pulse-highlight-hero': shouldFlash }"
    :style="{
      margin: '12px 16px',
      background: cardBackground,
      boxShadow: cardShadow,
      borderRadius: '20px',
      padding: '24px',
      color: 'white',
      transition: 'all 0.3s ease',
    }"
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
import { computed } from "vue";
import { formatRp } from "../js/routes";

const props = defineProps<{
  remaining: number;
  allocated: number;
  spent: number;
  shouldFlash?: boolean;
}>();

const cardBackground = computed(() => {
  return props.remaining < 0
    ? "linear-gradient(135deg, #ba1a1a, #8c1111)"
    : "linear-gradient(135deg, #0f5238, #2d6a4f)";
});

const cardShadow = computed(() => {
  return props.remaining < 0
    ? "0 8px 24px rgba(186, 26, 26, 0.15)"
    : "0 8px 24px rgba(15, 82, 56, 0.15)";
});
</script>

<style scoped>
.animate-in {
  animation: fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
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

.pulse-highlight-hero {
  animation: pulse-highlight-hero 2.5s cubic-bezier(0.25, 1, 0.5, 1);
}

@keyframes pulse-highlight-hero {
  0% {
    transform: scale(1);
    box-shadow: 0 8px 24px rgba(15, 82, 56, 0.15);
  }
  15% {
    transform: scale(1.02);
    box-shadow:
      0 8px 32px rgba(255, 255, 255, 0.4),
      0 0 0 6px rgba(255, 255, 255, 0.2);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 8px 24px rgba(15, 82, 56, 0.15);
  }
}
</style>
