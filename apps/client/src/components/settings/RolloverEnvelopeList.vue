<template>
  <div>
    <div
      style="font-size: 13px; font-weight: 700; color: var(--fintr-text-muted); margin-bottom: 10px"
    >
      Daftar Rincian Amplop:
    </div>

    <div
      style="
        max-height: 240px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 24px;
        padding-right: 4px;
      "
    >
      <div
        v-for="alloc in allocations"
        :key="alloc.id"
        style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--fintr-border);
          border-radius: 12px;
          padding: 10px 14px;
        "
      >
        <div style="display: flex; align-items: center; gap: 10px">
          <div
            :style="{ background: alloc.envelopeColor || '#94a3b8' }"
            style="width: 10px; height: 10px; border-radius: 50%"
          ></div>
          <div>
            <div style="font-size: 13px; font-weight: 700">{{ alloc.envelopeName }}</div>
            <div style="font-size: 11px; color: var(--fintr-text-muted); margin-top: 1px">
              Sisa: {{ formatRp(parseFloat(alloc.remaining)) }}
            </div>
          </div>
        </div>

        <!-- Destination Info Badge -->
        <div style="text-align: right">
          <span
            v-if="alloc.rolloverBehavior === 'rollover_to_savings'"
            style="
              font-size: 10px;
              font-weight: 700;
              background: rgba(16, 185, 129, 0.1);
              color: var(--fintr-success);
              padding: 2px 8px;
              border-radius: 6px;
              border: 1px solid rgba(16, 185, 129, 0.2);
            "
          >
            Pindah ke Tabungan
          </span>
          <span
            v-else-if="alloc.rolloverBehavior === 'rollover_self'"
            style="
              font-size: 10px;
              font-weight: 700;
              background: rgba(59, 130, 246, 0.1);
              color: var(--f7-theme-color-tint);
              padding: 2px 8px;
              border-radius: 6px;
              border: 1px solid rgba(59, 130, 246, 0.2);
            "
          >
            Tetap di Amplop
          </span>
          <span
            v-else
            style="
              font-size: 10px;
              font-weight: 700;
              background: rgba(239, 68, 68, 0.1);
              color: var(--fintr-danger);
              padding: 2px 8px;
              border-radius: 6px;
              border: 1px solid rgba(239, 68, 68, 0.2);
            "
          >
            Reset ke Nol
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatRp } from "../../js/routes";

defineProps<{
  allocations: Array<{
    id: string;
    envelopeName: string;
    envelopeColor?: string;
    remaining: string;
    rolloverBehavior: string;
  }>;
}>();
</script>
