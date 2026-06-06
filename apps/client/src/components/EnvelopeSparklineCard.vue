<template>
  <div
    style="
      background: white;
      border: 1px solid #bfc9c1;
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.01);
    "
  >
    <!-- Title Row -->
    <div
      style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      "
    >
      <div
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
          :style="{
            background: category.color,
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            display: 'inline-block',
          }"
        ></span>
        {{ category.name }}
      </div>
      <div
        style="
          font-size: 11px;
          background: #f3f1e9;
          color: #404943;
          padding: 4px 8px;
          border-radius: 8px;
          font-weight: 600;
        "
      >
        Rata-rata: {{ formatRp(averageSpent) }}
      </div>
    </div>

    <!-- Spending line representation (sparkline) -->
    <div style="display: flex; align-items: center; gap: 16px; height: 50px">
      <!-- Sparkline SVG -->
      <div style="flex: 1; height: 40px; border-bottom: 1px solid #e3e8e4">
        <svg
          viewBox="0 0 100 40"
          width="100%"
          height="100%"
          preserveAspectRatio="none"
          style="overflow: visible"
        >
          <!-- Line path -->
          <path
            :d="sparklineD"
            fill="none"
            :stroke="category.color"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <!-- Dots on points -->
          <circle
            v-for="(pt, pidx) in sparkPoints"
            :key="pidx"
            :cx="pt.x"
            :cy="pt.y"
            r="3"
            :fill="category.color"
            stroke="#ffffff"
            stroke-width="1"
          />
        </svg>
      </div>

      <!-- Metrics -->
      <div
        style="
          width: 110px;
          text-align: right;
          display: flex;
          flex-direction: column;
          justify-content: center;
        "
      >
        <span style="font-size: 10px; color: #707973">Bulan Terakhir</span>
        <span
          style="font-size: 14px; font-weight: 800; color: #ba1a1a; font-family: Inter, sans-serif"
        >
          {{ formatRp(lastSpent) }}
        </span>
      </div>
    </div>

    <!-- Mini details expander table -->
    <div
      style="
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #f3f1e9;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        text-align: center;
        font-size: 11px;
        color: #707973;
      "
    >
      <div v-for="hist in recentHistory" :key="hist.periodId">
        <div style="font-weight: 700; color: #161a32; margin-bottom: 2px">
          {{ getPeriodName(hist.periodId) }}
        </div>
        <div>Belanja: {{ formatCompact(parseFloat(hist.spent)) }}</div>
        <div style="opacity: 0.8">Budget: {{ formatCompact(parseFloat(hist.allocated)) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { formatRp } from "../js/routes";

interface HistoryItem {
  periodId: string;
  allocated: string;
  spent: string;
}

interface CategoryCompare {
  name: string;
  color: string;
  history: HistoryItem[];
}

interface PeriodTotal {
  id: string;
  year: number;
  month: number;
  name: string;
  totalAllocated: string;
  totalSpent: string;
  totalRemaining: string;
}

const props = defineProps<{
  category: CategoryCompare;
  periodsData: PeriodTotal[];
}>();

const averageSpent = computed(() => {
  if (props.category.history.length === 0) return 0;
  const totalSpent = props.category.history.reduce((sum, h) => sum + parseFloat(h.spent), 0);
  return totalSpent / props.category.history.length;
});

const lastSpent = computed(() => {
  if (props.category.history.length === 0) return 0;
  return parseFloat(props.category.history[props.category.history.length - 1].spent);
});

const sparkPoints = computed(() => {
  const count = props.category.history.length;
  if (count === 0) return [];

  // Find max value in history to scale
  let max = 500000;
  for (const h of props.category.history) {
    const s = parseFloat(h.spent);
    if (s > max) max = s;
  }
  if (max === 0) max = 1;

  // We map x from 5 to 95, y from 35 (min) to 5 (max)
  return props.category.history.map((h, idx) => {
    const x = 5 + idx * (90 / Math.max(count - 1, 1));
    const s = parseFloat(h.spent);
    const y = 35 - (s / max) * 30;
    return { x, y };
  });
});

const sparklineD = computed(() => {
  const pts = sparkPoints.value;
  if (pts.length === 0) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i].x} ${pts[i].y}`;
  }
  return d;
});

const recentHistory = computed(() => {
  return props.category.history.slice(-3);
});

const getPeriodName = (periodId: string) => {
  const p = props.periodsData.find(p => p.id === periodId);
  return p ? p.name.split(" ")[0] : "Periode"; // e.g. "Mei" or "Jun"
};

// Compact number formatter for detail labels
const formatCompact = (val: number): string => {
  if (val >= 1000000) {
    return `Rp ${(val / 1000000).toFixed(1)}jt`;
  }
  if (val >= 1000) {
    return `Rp ${(val / 1000).toFixed(0)}rb`;
  }
  return `Rp ${val}`;
};
</script>
