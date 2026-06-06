<template>
  <div>
    <div style="margin-bottom: 16px">
      <label
        style="
          font-size: 12px;
          color: #707973;
          font-weight: 600;
          display: block;
          margin-bottom: 6px;
        "
        >PILIH PERIODE AUDIT</label
      >
      <div
        style="
          position: relative;
          display: flex;
          align-items: center;
          background: white;
          border: 1px solid #bfc9c1;
          border-radius: 12px;
          padding: 4px 12px;
        "
      >
        <span
          class="material-symbols-outlined"
          style="font-size: 20px; color: #707973; margin-right: 8px"
          >calendar_month</span
        >
        <select
          v-model="selectedPeriodId"
          @change="fetchRolloverLogs"
          style="
            width: 100%;
            border: none;
            background: transparent;
            font-size: 14px;
            font-weight: 600;
            color: #161a32;
            padding: 8px 0;
            outline: none;
            cursor: pointer;
            -webkit-appearance: none;
          "
        >
          <option v-for="p in periodsList" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
        <span
          class="material-symbols-outlined"
          style="font-size: 20px; color: #707973; pointer-events: none; margin-left: auto"
          >arrow_drop_down</span
        >
      </div>
    </div>

    <div v-if="loadingLogs" style="text-align: center; padding: 32px">
      <f7-preloader size="28" color="green"></f7-preloader>
      <div style="margin-top: 12px; color: var(--fintr-text-muted); font-size: 13px">
        Memuat log rollover...
      </div>
    </div>

    <div
      v-else-if="rolloverLogsData.length === 0"
      style="
        text-align: center;
        padding: 32px;
        background: white;
        border: 1px solid #bfc9c1;
        border-radius: 16px;
      "
    >
      <div style="font-size: 40px; margin-bottom: 12px">📥</div>
      <div style="font-weight: 700; color: #161a32; font-size: 14px; margin-bottom: 6px">
        Tidak Ada Log Rollover
      </div>
      <div style="font-size: 12px; color: #707973">
        Tidak ditemukan catatan log pemindahan saldo otomatis saat memulai periode ini.
      </div>
    </div>

    <div v-else style="display: flex; flex-direction: column; gap: 12px">
      <div
        v-for="log in rolloverLogsData"
        :key="log.id"
        style="
          background: white;
          border: 1px solid #bfc9c1;
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.01);
        "
      >
        <div style="display: flex; justify-content: space-between; align-items: center">
          <div style="display: flex; align-items: center; gap: 8px">
            <span class="material-symbols-outlined" style="font-size: 20px; color: #0f5238"
              >mail</span
            >
            <span style="font-weight: 700; font-size: 14px; color: #161a32">{{
              log.envelopeName
            }}</span>
          </div>
          <span :style="getBehaviorBadgeStyle(log.behavior)">
            {{ getBehaviorLabel(log.behavior) }}
          </span>
        </div>

        <div
          style="
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            background: #f8faf9;
            border-radius: 12px;
            padding: 12px;
            border: 1px solid #e3e8e4;
          "
        >
          <div>
            <div
              style="
                font-size: 10px;
                color: #707973;
                font-weight: 600;
                text-transform: uppercase;
                margin-bottom: 4px;
              "
            >
              Sisa Saldo Lalu
            </div>
            <div
              style="
                font-size: 14px;
                font-weight: 800;
                color: #404943;
                font-family: Inter, sans-serif;
              "
            >
              {{ formatRp(parseFloat(log.remainingAmount)) }}
            </div>
          </div>
          <div>
            <div
              style="
                font-size: 10px;
                color: #707973;
                font-weight: 600;
                text-transform: uppercase;
                margin-bottom: 4px;
              "
            >
              Dipindahkan
            </div>
            <div
              style="
                font-size: 14px;
                font-weight: 800;
                color: #0f5238;
                font-family: Inter, sans-serif;
              "
            >
              {{ formatRp(parseFloat(log.rolledOverAmount)) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { f7Preloader } from "framework7-vue";
import { periods } from "../js/api";
import { formatRp } from "../js/routes";

interface PeriodTotal {
  id: string;
  name: string;
}

const props = defineProps<{
  periodsList: PeriodTotal[];
  initialPeriodId?: string;
}>();

const selectedPeriodId = ref<string>("");
const rolloverLogsData = ref<any[]>([]);
const loadingLogs = ref(false);

const fetchRolloverLogs = async () => {
  if (!selectedPeriodId.value) return;
  loadingLogs.value = true;
  try {
    const logs = await periods.getRolloverLogs(selectedPeriodId.value);
    rolloverLogsData.value = logs;
  } catch (err) {
    console.error("Gagal mengambil log rollover:", err);
  } finally {
    loadingLogs.value = false;
  }
};

const getBehaviorLabel = (behavior: string) => {
  switch (behavior) {
    case "reset":
      return "Reset ke Nol";
    case "rollover_self":
      return "Sisa Saldo Tetap";
    case "rollover_to_savings":
      return "Transfer ke Tabungan";
    default:
      return behavior;
  }
};

const getBehaviorBadgeStyle = (behavior: string) => {
  const base = {
    fontSize: "11px",
    fontWeight: "700",
    padding: "4px 8px",
    borderRadius: "6px",
  };
  switch (behavior) {
    case "reset":
      return {
        ...base,
        background: "#fee2e2",
        color: "#991b1b",
      };
    case "rollover_self":
      return {
        ...base,
        background: "#e0f2fe",
        color: "#075985",
      };
    case "rollover_to_savings":
      return {
        ...base,
        background: "#dcfce7",
        color: "#166534",
      };
    default:
      return {
        ...base,
        background: "#f3f4f6",
        color: "#374151",
      };
  }
};

const initSelectedPeriod = () => {
  if (props.initialPeriodId) {
    selectedPeriodId.value = props.initialPeriodId;
  } else if (props.periodsList && props.periodsList.length > 0) {
    selectedPeriodId.value = props.periodsList[0].id;
  }
  fetchRolloverLogs();
};

watch(
  () => props.periodsList,
  () => {
    if (!selectedPeriodId.value && props.periodsList && props.periodsList.length > 0) {
      initSelectedPeriod();
    }
  },
  { immediate: true }
);

onMounted(() => {
  initSelectedPeriod();
});
</script>
