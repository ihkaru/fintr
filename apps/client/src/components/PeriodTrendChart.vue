<template>
  <div
    style="
      background: white;
      border: 1px solid #bfc9c1;
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.01);
    "
  >
    <div
      style="
        font-weight: 800;
        color: #161a32;
        font-size: 15px;
        margin-bottom: 4px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      "
    >
      <span>Anggaran vs Terpakai</span>
      <span style="font-size: 11px; font-weight: 500; color: #707973">
        {{ periodsData.length }} Periode Terakhir
      </span>
    </div>
    <div style="font-size: 12px; color: #707973; margin-bottom: 20px; display: flex; gap: 16px">
      <span style="display: flex; align-items: center; gap: 6px">
        <span
          style="
            width: 12px;
            height: 12px;
            background: #0f5238;
            border-radius: 3px;
            display: inline-block;
          "
        ></span>
        Total Anggaran
      </span>
      <span style="display: flex; align-items: center; gap: 6px">
        <span
          style="
            width: 12px;
            height: 12px;
            background: #485f84;
            border-radius: 3px;
            display: inline-block;
          "
        ></span>
        Total Belanja
      </span>
    </div>

    <!-- Dynamic SVG Chart -->
    <div style="width: 100%; height: 200px; position: relative">
      <svg viewBox="0 0 400 200" width="100%" height="100%" style="overflow: visible">
        <!-- Horizontal grid lines -->
        <line x1="40" y1="20" x2="380" y2="20" stroke="#f1f3f1" stroke-width="1" />
        <line x1="40" y1="70" x2="380" y2="70" stroke="#f1f3f1" stroke-width="1" />
        <line x1="40" y1="120" x2="380" y2="120" stroke="#f1f3f1" stroke-width="1" />
        <line x1="40" y1="170" x2="380" y2="170" stroke="#f1f3f1" stroke-width="1" />

        <!-- Y Axis labels -->
        <text x="32" y="24" text-anchor="end" font-size="9" fill="#707973" font-family="Inter">
          {{ formatCompact(maxChartVal) }}
        </text>
        <text x="32" y="74" text-anchor="end" font-size="9" fill="#707973" font-family="Inter">
          {{ formatCompact(maxChartVal * 0.67) }}
        </text>
        <text x="32" y="124" text-anchor="end" font-size="9" fill="#707973" font-family="Inter">
          {{ formatCompact(maxChartVal * 0.33) }}
        </text>
        <text x="32" y="174" text-anchor="end" font-size="9" fill="#707973" font-family="Inter">
          Rp0
        </text>

        <!-- Bars rendering -->
        <g v-for="(p, idx) in periodsData" :key="p.id">
          <!-- Allocated Bar -->
          <rect
            :x="getBarX(idx, 0)"
            :y="getBarY(p.totalAllocated)"
            :width="barWidth"
            :height="getBarHeight(p.totalAllocated)"
            fill="#0f5238"
            rx="3"
            style="transition: all 0.3s ease"
          />
          <!-- Spent Bar -->
          <rect
            :x="getBarX(idx, 1)"
            :y="getBarY(p.totalSpent)"
            :width="barWidth"
            :height="getBarHeight(p.totalSpent)"
            fill="#485f84"
            rx="3"
            style="transition: all 0.3s ease"
          />
          <!-- Month Label -->
          <text
            :x="getGroupCenter(idx)"
            y="188"
            text-anchor="middle"
            font-size="9"
            font-weight="600"
            fill="#161a32"
            font-family="Inter"
          >
            {{ p.name }}
          </text>
        </g>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

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
  periodsData: PeriodTotal[];
}>();

const barWidth = 14;

// Max value helper to scale Y-axis in charts
const maxChartVal = computed(() => {
  let max = 5000000; // default minimum roof
  for (const p of props.periodsData) {
    const allocated = parseFloat(p.totalAllocated);
    const spent = parseFloat(p.totalSpent);
    if (allocated > max) max = allocated;
    if (spent > max) max = spent;
  }
  return max * 1.1; // 10% padding on top
});

// Compact number formatter for chart labels (e.g., Rp2.5jt, Rp800rb)
const formatCompact = (val: number): string => {
  if (val >= 1000000) {
    return `Rp ${(val / 1000000).toFixed(1)}jt`;
  }
  if (val >= 1000) {
    return `Rp ${(val / 1000).toFixed(0)}rb`;
  }
  return `Rp ${val}`;
};

// SVG bar layout helpers
const getGroupCenter = (idx: number) => {
  const count = props.periodsData.length;
  const totalWidth = 340; // width of rendering space
  const spacing = totalWidth / count;
  return 40 + idx * spacing + spacing / 2;
};

const getBarX = (idx: number, barIdx: number) => {
  const center = getGroupCenter(idx);
  if (barIdx === 0) {
    return center - barWidth - 2;
  } else {
    return center + 2;
  }
};

const getBarY = (valStr: string) => {
  const val = parseFloat(valStr);
  const max = maxChartVal.value;
  const pct = val / max;
  return 170 - 150 * pct;
};

const getBarHeight = (valStr: string) => {
  const val = parseFloat(valStr);
  const max = maxChartVal.value;
  const pct = val / max;
  return Math.max(150 * pct, 2); // minimum 2px so it is visible
};
</script>
