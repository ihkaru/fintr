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
        <!-- Smart Insights Summary Card -->
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
              style="
                font-size: 13px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              "
            >
              Smart Insights
            </span>
          </div>

          <div
            style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px"
          >
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
                style="
                  font-size: 16px;
                  font-weight: 800;
                  color: var(--fintr-success);
                  margin-top: 2px;
                "
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
            <span
              class="material-symbols-outlined"
              style="color: var(--fintr-danger); font-size: 20px"
              >warning</span
            >
            <div style="font-size: 12px; line-height: 1.5; color: var(--fintr-text)">
              Ada sisa dana sebesar
              <strong style="color: var(--fintr-danger)">{{
                formatRp(previewSummary.toReset)
              }}</strong>
              yang diatur untuk <strong>Reset ke Nol</strong> (akan hangus). Kamu bisa mengubah
              perilaku rollover di edit amplop agar sisa dana tidak hangus.
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
              <strong>{{ previewData.allocations.length }} amplop</strong>.
            </span>
          </div>
        </div>

        <!-- Envelope Rollover Preview List -->
        <div
          style="
            font-size: 13px;
            font-weight: 700;
            color: var(--fintr-text-muted);
            margin-bottom: 10px;
          "
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
            v-for="alloc in previewData.allocations"
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
            @click="$emit('confirm')"
          >
            {{ closingPeriod ? "Memproses..." : "Tutup Periode 🔁" }}
          </button>
        </div>
      </div>
    </div>
  </f7-sheet>
</template>

<script setup lang="ts">
import { f7Sheet, f7Preloader } from "framework7-vue";
import { formatRp } from "../../js/routes";

defineProps<{
  opened: boolean;
  loadingPreview: boolean;
  previewData: any;
  previewSummary: any;
  closingPeriod: boolean;
}>();

defineEmits<{
  (e: "closed"): void;
  (e: "confirm"): void;
}>();
</script>
