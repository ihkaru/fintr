<template>
  <div
    class="card-glass animate-in"
    style="margin-bottom: 20px; padding: 16px; background: rgba(255, 255, 255, 0.02)"
  >
    <div
      style="
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        color: var(--f7-theme-color-tint);
      "
    >
      <span class="material-symbols-outlined" style="font-size: 20px">insights</span>
      <span
        style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px"
      >
        Smart Insights
      </span>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px">
      <div
        style="
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--fintr-border);
          border-radius: 12px;
          padding: 10px;
        "
      >
        <div style="font-size: 11px; color: var(--fintr-text-muted)">Akan Ditabung</div>
        <div
          style="font-size: 16px; font-weight: 800; color: var(--fintr-success); margin-top: 2px"
        >
          {{ formatRp(previewSummary.toSavings) }}
        </div>
      </div>
      <div
        style="
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--fintr-border);
          border-radius: 12px;
          padding: 10px;
        "
      >
        <div style="font-size: 11px; color: var(--fintr-text-muted)">Tetap di Amplop</div>
        <div
          style="
            font-size: 16px;
            font-weight: 800;
            color: var(--f7-theme-color-tint);
            margin-top: 2px;
          "
        >
          {{ formatRp(previewSummary.toSelf) }}
        </div>
      </div>
    </div>

    <!-- Alert warning for reset amount > 0 -->
    <div
      v-if="previewSummary.toReset > 0"
      style="
        display: flex;
        gap: 10px;
        background: rgba(239, 68, 68, 0.08);
        border: 1px solid rgba(239, 68, 68, 0.2);
        border-radius: 12px;
        padding: 12px;
        margin-bottom: 12px;
      "
    >
      <span class="material-symbols-outlined" style="color: var(--fintr-danger); font-size: 20px"
        >warning</span
      >
      <div style="font-size: 12px; line-height: 1.5; color: var(--fintr-text)">
        Ada sisa dana sebesar
        <strong style="color: var(--fintr-danger)">{{ formatRp(previewSummary.toReset) }}</strong>
        yang diatur untuk <strong>Reset ke Nol</strong> (akan hangus). Kamu bisa mengubah perilaku
        rollover di edit amplop agar sisa dana tidak hangus.
      </div>
    </div>

    <div
      style="
        font-size: 12px;
        line-height: 1.5;
        color: var(--fintr-text-muted);
        display: flex;
        gap: 8px;
        align-items: flex-start;
      "
    >
      <span
        class="material-symbols-outlined"
        style="font-size: 16px; color: var(--f7-theme-color-tint)"
        >info</span
      >
      <span>
        Total sisa anggaran terkumpul:
        <strong>{{ formatRp(previewSummary.totalRemaining) }}</strong> dari
        <strong>{{ totalEnvelopes }} amplop</strong>.
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatRp } from "../../js/routes";

defineProps<{
  previewSummary: {
    totalRemaining: number;
    toSavings: number;
    toSelf: number;
    toReset: number;
  };
  totalEnvelopes: number;
}>();
</script>
