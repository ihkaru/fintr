<template>
  <f7-sheet
    class="rollover-sheet"
    style="
      height: auto;
      --f7-sheet-bg-color: var(--fintr-bg-dark);
      border-radius: 20px 20px 0 0;
      border-top: 1px solid var(--fintr-border);
    "
    :opened="opened"
    @sheet:closed="$emit('closed')"
    backdrop
  >
    <div style="padding: 20px 20px 32px 20px; color: var(--fintr-text)">
      <!-- Drag handle -->
      <div
        style="
          width: 36px;
          height: 4px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
          margin: 0 auto 16px auto;
        "
      ></div>

      <div
        style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        "
      >
        <div>
          <div style="font-size: 18px; font-weight: 800; color: var(--fintr-text)">
            Pratinjau Rollover
          </div>
          <div style="font-size: 13px; color: var(--fintr-text-muted)">
            Evaluasi keuangan sebelum menutup periode
          </div>
        </div>
        <button
          @click="$emit('closed')"
          style="
            background: rgba(255, 255, 255, 0.05);
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--fintr-text);
          "
        >
          <span class="material-symbols-outlined" style="font-size: 18px">close</span>
        </button>
      </div>

      <div v-if="loadingPreview" style="text-align: center; padding: 32px 0">
        <f7-preloader size="28"></f7-preloader>
        <div style="margin-top: 12px; font-size: 13px; color: var(--fintr-text-muted)">
          Menganalisis sisa anggaran...
        </div>
      </div>

      <div v-else-if="previewData">
        <!-- Decomposed: Rollover Summary Card -->
        <RolloverSummaryCard
          :preview-summary="previewSummary"
          :total-envelopes="previewData.allocations.length"
        />

        <!-- Kelompangan Periode Options -->
        <div
          v-if="monthDiff > 1"
          class="card-glass animate-in"
          style="
            margin-bottom: 20px;
            padding: 16px;
            background: rgba(255, 166, 0, 0.03);
            border: 1px solid rgba(255, 166, 0, 0.15);
          "
        >
          <div
            style="
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 12px;
              color: var(--fintr-warning);
            "
          >
            <span class="material-symbols-outlined" style="font-size: 20px"
              >history_toggle_off</span
            >
            <span style="font-size: 13px; font-weight: 700; text-transform: uppercase">
              Kelompangan Waktu ({{ monthDiff }} Bulan)
            </span>
          </div>

          <div v-if="monthDiff > 6">
            <p
              style="font-size: 12px; line-height: 1.5; color: var(--fintr-text); margin: 0 0 8px 0"
            >
              Periode aktif terakhir Anda berjarak <strong>{{ monthDiff }} bulan</strong> dari bulan
              saat ini.
            </p>
            <div
              style="
                background: rgba(239, 68, 68, 0.08);
                border: 1px solid rgba(239, 68, 68, 0.2);
                border-radius: 8px;
                padding: 10px;
                font-size: 11px;
                color: var(--fintr-danger);
                line-height: 1.4;
                display: flex;
                align-items: flex-start;
                gap: 6px;
              "
            >
              <span class="material-symbols-outlined" style="font-size: 16px">gavel</span>
              <span>
                Karena kelompangan melebihi batas 6 bulan, sistem akan otomatis melakukan
                <strong>Lompati Bulan Kosong (Lompat Langsung)</strong> ke bulan saat ini untuk
                menjaga efisiensi dan performa.
              </span>
            </div>
          </div>

          <div v-else>
            <p
              style="
                font-size: 12px;
                line-height: 1.5;
                color: var(--fintr-text);
                margin: 0 0 12px 0;
              "
            >
              Ada jarak waktu sejak periode terakhir. Pilih metode pembuatan periode baru:
            </p>

            <div style="display: flex; flex-direction: column; gap: 10px">
              <!-- Option A: Cascade -->
              <label
                style="
                  display: flex;
                  align-items: flex-start;
                  gap: 10px;
                  background: rgba(255, 255, 255, 0.02);
                  border: 1px solid var(--fintr-border);
                  border-radius: 10px;
                  padding: 10px;
                  cursor: pointer;
                "
                :style="
                  !fastForwardSelected
                    ? {
                        borderColor: 'var(--f7-theme-color-tint)',
                        background: 'rgba(59, 130, 246, 0.04)',
                      }
                    : {}
                "
              >
                <input
                  type="radio"
                  name="rollover_mode"
                  :value="false"
                  v-model="fastForwardSelected"
                  style="margin-top: 3px; accent-color: var(--f7-theme-color-tint)"
                />
                <div>
                  <div style="font-size: 12px; font-weight: 700">
                    Tutup Runtut (Bulan demi Bulan)
                  </div>
                  <div style="font-size: 10px; color: var(--fintr-text-muted); margin-top: 2px">
                    Secara bertahap menyelesaikan rollover satu per satu ke bulan berikutnya:
                    <strong>{{ getNextPeriodLabel() }}</strong>
                  </div>
                </div>
              </label>

              <!-- Option B: Fast-Forward -->
              <label
                style="
                  display: flex;
                  align-items: flex-start;
                  gap: 10px;
                  background: rgba(255, 255, 255, 0.02);
                  border: 1px solid var(--fintr-border);
                  border-radius: 10px;
                  padding: 10px;
                  cursor: pointer;
                "
                :style="
                  fastForwardSelected
                    ? {
                        borderColor: 'var(--f7-theme-color-tint)',
                        background: 'rgba(59, 130, 246, 0.04)',
                      }
                    : {}
                "
              >
                <input
                  type="radio"
                  name="rollover_mode"
                  :value="true"
                  v-model="fastForwardSelected"
                  style="margin-top: 3px; accent-color: var(--f7-theme-color-tint)"
                />
                <div>
                  <div style="font-size: 12px; font-weight: 700">
                    Lompati Bulan Kosong (Lompat ke Bulan Ini)
                  </div>
                  <div style="font-size: 10px; color: var(--fintr-text-muted); margin-top: 2px">
                    Mengabaikan bulan-bulan tanpa aktivitas dan langsung membuka periode baru di
                    bulan ini: <strong>{{ getCurrentPeriodLabel() }}</strong>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- Decomposed: Envelope Rollover Preview List -->
        <RolloverEnvelopeList :allocations="previewData.allocations" />

        <!-- Actions -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px">
          <button
            class="btn-primary"
            style="
              background: rgba(255, 255, 255, 0.05);
              color: var(--fintr-text);
              border: 1px solid var(--fintr-border);
              box-shadow: none;
            "
            @click="$emit('closed')"
          >
            Batal
          </button>
          <button
            class="btn-primary"
            style="background: linear-gradient(135deg, var(--fintr-warning), var(--fintr-danger))"
            :disabled="closingPeriod"
            @click="$emit('confirm', { fastForward: fastForwardSelected })"
          >
            {{ closingPeriod ? "Memproses..." : "Tutup Periode 🔁" }}
          </button>
        </div>
      </div>
    </div>
  </f7-sheet>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { f7Sheet, f7Preloader } from "framework7-vue";
import RolloverSummaryCard from "./RolloverSummaryCard.vue";
import RolloverEnvelopeList from "./RolloverEnvelopeList.vue";

const props = defineProps<{
  opened: boolean;
  loadingPreview: boolean;
  previewData: any;
  previewSummary: any;
  closingPeriod: boolean;
  activePeriod: any;
}>();

defineEmits<{
  (e: "closed"): void;
  (e: "confirm", options: { fastForward: boolean }): void;
}>();

const MONTH_NAMES = [
  "",
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const monthDiff = computed(() => {
  if (!props.activePeriod) return 0;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  return (currentYear - props.activePeriod.year) * 12 + (currentMonth - props.activePeriod.month);
});

const fastForwardSelected = ref(false);

watch(
  () => monthDiff.value,
  val => {
    if (val > 6) {
      fastForwardSelected.value = true;
    } else {
      fastForwardSelected.value = false;
    }
  },
  { immediate: true }
);

const getNextPeriodLabel = () => {
  if (!props.activePeriod) return "";
  let m = props.activePeriod.month + 1;
  let y = props.activePeriod.year;
  if (m > 12) {
    m = 1;
    y += 1;
  }
  return `${MONTH_NAMES[m]} ${y}`;
};

const getCurrentPeriodLabel = () => {
  const now = new Date();
  return `${MONTH_NAMES[now.getMonth() + 1]} ${now.getFullYear()}`;
};
</script>
