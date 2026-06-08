<template>
  <div
    class="envelope-card animate-in"
    :class="{ 'pulse-highlight-card': isHighlighted }"
    :style="{
      background: allocation.isActive === false ? '#f8f9fa' : '#ffffff',
      border: allocation.isActive === false ? '1px dashed #ced4da' : '1px solid #bfc9c1',
      borderRadius: '16px',
      padding: '16px',
      marginBottom: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      cursor: 'pointer',
      opacity: allocation.isActive === false ? 0.85 : 1,
      transition: 'all 0.3s ease',
    }"
    @click="$emit('click')"
  >
    <div
      style="
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 8px;
      "
    >
      <div
        class="name"
        style="
          font-weight: 700;
          color: #161a32;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        "
      >
        <span
          class="dot"
          :style="{
            background: allocation.envelopeColor,
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            display: 'inline-block',
          }"
        ></span>
        {{ allocation.envelopeName }}
        <span
          v-if="allocation.isActive === false"
          style="
            font-size: 10px;
            background: #fff8e1;
            color: #b25e00;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 700;
            border: 1px solid #ffe0b2;
            margin-left: 4px;
          "
        >
          Ditutup
        </span>
      </div>
      <div
        class="amount font-headline"
        :style="{ fontWeight: '800', color: remainingColor, fontSize: '15px' }"
      >
        {{ formatRp(parseFloat(allocation.remaining)) }}
      </div>
    </div>
    <div
      style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 11px;
        color: #707973;
        margin-bottom: 8px;
      "
    >
      <span>Terpakai: {{ formatRp(parseFloat(allocation.totalSpent)) }}</span>
      <span
        >Alokasi:
        {{
          formatRp(parseFloat(allocation.allocatedAmount) + parseFloat(allocation.rolloverAmount))
        }}</span
      >
    </div>
    <div
      class="progress-bar"
      style="height: 6px; background: #f3f1e9; border-radius: 3px; overflow: hidden"
    >
      <div
        class="fill"
        :style="{
          width: `${progressPct}%`,
          background: progressBarColor,
          height: '100%',
        }"
      ></div>
    </div>

    <!-- Over-budgeting warning -->
    <div
      v-if="parseFloat(allocation.remaining) < 0"
      style="
        margin-top: 10px;
        font-size: 11px;
        color: var(--fintr-danger);
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 4px;
      "
    >
      ⚠️ Anggaran bulan ini lebih kecil dari belanjaan berjalan
    </div>

    <!-- Closed envelope warning -->
    <div
      v-if="allocation.isActive === false"
      style="
        margin-top: 10px;
        font-size: 11px;
        color: #b25e00;
        background: #fff8e1;
        border: 1px solid #ffe0b2;
        border-radius: 8px;
        padding: 6px 10px;
        font-weight: 500;
        line-height: 1.4;
      "
    >
      ⚠️ <strong>Amplop Ditutup.</strong> Pengeluaran bulan ini tetap tercatat, namun amplop tidak
      akan muncul di bulan depan.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { formatRp } from "../js/routes";

interface Allocation {
  id: string;
  envelopeName: string;
  envelopeColor: string;
  allocatedAmount: string;
  rolloverAmount: string;
  totalSpent: string;
  remaining: string;
  isActive?: boolean;
}

const props = defineProps<{
  allocation: Allocation;
  isHighlighted?: boolean;
}>();

defineEmits<{
  (e: "click"): void;
}>();

const progressPct = computed(() => {
  const allocated =
    parseFloat(props.allocation.allocatedAmount) + parseFloat(props.allocation.rolloverAmount);
  const spent = parseFloat(props.allocation.totalSpent);
  return allocated > 0 ? Math.min((spent / allocated) * 100, 100) : 0;
});

const remainingColor = computed(() => {
  return parseFloat(props.allocation.remaining) < 0 ? "var(--fintr-danger)" : "#0f5238";
});

const progressBarColor = computed(() => {
  const pct = progressPct.value;
  if (pct > 90) return "var(--fintr-danger)";
  if (pct > 70) return "var(--fintr-warning)";
  return props.allocation.envelopeColor;
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

.pulse-highlight-card {
  animation: pulse-highlight-card 2.5s cubic-bezier(0.25, 1, 0.5, 1);
}

@keyframes pulse-highlight-card {
  0% {
    border-color: #bfc9c1;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  }
  15% {
    border-color: #0f5238;
    box-shadow:
      0 0 0 6px rgba(15, 82, 56, 0.15),
      0 4px 16px rgba(15, 82, 56, 0.1);
    background-color: #f0f7f4 !important;
  }
  100% {
    border-color: #bfc9c1;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  }
}
</style>
