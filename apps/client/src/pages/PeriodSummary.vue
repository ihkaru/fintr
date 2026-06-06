<template>
  <f7-page name="period-summary" @page:beforein="loadPeriodSummary">
    <f7-navbar>
      <f7-nav-left>
        <f7-link
          icon-only
          @click="goBack"
          style="display: flex; align-items: center; gap: 4px; color: var(--fintr-primary)"
        >
          <span class="material-symbols-outlined" style="font-size: 24px">arrow_back</span>
          <span class="if-not-md" style="font-size: 16px; font-weight: 600">Kembali</span>
        </f7-link>
      </f7-nav-left>
      <f7-nav-title class="font-headline">Analisis Anggaran</f7-nav-title>
    </f7-navbar>

    <div v-if="loading" style="text-align: center; padding: 48px">
      <f7-preloader size="42" color="green"></f7-preloader>
      <div style="margin-top: 16px; color: var(--fintr-text-muted)">
        Menganalisis riwayat pengeluaran...
      </div>
    </div>

    <div
      v-else-if="periodsData.length === 0"
      class="empty-state"
      style="
        margin: 32px 16px;
        background: white;
        border: 1px solid #bfc9c1;
        border-radius: 16px;
        padding: 32px;
        text-align: center;
      "
    >
      <div style="font-size: 48px; margin-bottom: 16px">📊</div>
      <div style="font-weight: 700; color: #161a32; font-size: 16px; margin-bottom: 8px">
        Belum Ada Riwayat Anggaran
      </div>
      <div style="font-size: 13px; color: #707973">
        Anda perlu menyelesaikan setidaknya satu periode anggaran dan melakukan rollover untuk
        melihat analisis perbandingan.
      </div>
    </div>

    <div v-else style="padding: 16px">
      <!-- Segmented Buttons for Tab/View Switching -->
      <div
        style="
          margin-bottom: 20px;
          display: flex;
          background: #e3e8e4;
          border-radius: 12px;
          padding: 4px;
          border: 1px solid #bfc9c1;
        "
      >
        <button
          @click="activeTab = 'trend'"
          :style="{
            flex: 1,
            border: 'none',
            background: activeTab === 'trend' ? '#ffffff' : 'transparent',
            color: activeTab === 'trend' ? '#0f5238' : '#707973',
            fontWeight: activeTab === 'trend' ? '700' : '500',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'trend' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
          }"
        >
          Tren Bulanan
        </button>
        <button
          @click="activeTab = 'category'"
          :style="{
            flex: 1,
            border: 'none',
            background: activeTab === 'category' ? '#ffffff' : 'transparent',
            color: activeTab === 'category' ? '#0f5238' : '#707973',
            fontWeight: activeTab === 'category' ? '700' : '500',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'category' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
          }"
        >
          Perbandingan Amplop
        </button>
        <button
          @click="activeTab = 'rollover'"
          :style="{
            flex: 1,
            border: 'none',
            background: activeTab === 'rollover' ? '#ffffff' : 'transparent',
            color: activeTab === 'rollover' ? '#0f5238' : '#707973',
            fontWeight: activeTab === 'rollover' ? '700' : '500',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'rollover' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none',
          }"
        >
          Log Rollover
        </button>
      </div>

      <!-- Tab 1: Tren Bulanan (Trend View) -->
      <div v-if="activeTab === 'trend'" class="animate-in">
        <!-- SVG Trend Chart Card -->
        <PeriodTrendChart :periods-data="periodsData" />

        <!-- KPI Metrics Row -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px">
          <div
            style="
              background: white;
              border: 1px solid #bfc9c1;
              border-radius: 16px;
              padding: 16px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.01);
            "
          >
            <div
              style="font-size: 11px; color: #707973; font-weight: 600; text-transform: uppercase"
            >
              Rata-rata Menabung
            </div>
            <div
              style="
                font-size: 18px;
                font-weight: 800;
                color: #0f5238;
                margin: 4px 0;
                font-family: &quot;Manrope&quot;, sans-serif;
              "
            >
              {{ formatRp(averageSaving) }}
            </div>
            <div style="font-size: 11px; color: #707973">Per bulan dari sisa anggaran</div>
          </div>
          <div
            style="
              background: white;
              border: 1px solid #bfc9c1;
              border-radius: 16px;
              padding: 16px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.01);
            "
          >
            <div
              style="font-size: 11px; color: #707973; font-weight: 600; text-transform: uppercase"
            >
              Saving Rate
            </div>
            <div
              style="
                font-size: 18px;
                font-weight: 800;
                color: #485f84;
                margin: 4px 0;
                font-family: &quot;Manrope&quot;, sans-serif;
              "
            >
              {{ savingRatePct }}%
            </div>
            <div
              style="
                font-size: 11px;
                color: #22c55e;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 4px;
              "
            >
              <span style="font-size: 12px">📈</span> Sehat & Stabil
            </div>
          </div>
        </div>

        <!-- Household context info for newlyweds -->
        <div
          style="
            background: rgba(15, 82, 56, 0.05);
            border: 1px dashed #0f5238;
            border-radius: 16px;
            padding: 16px;
            margin-bottom: 20px;
            display: flex;
            gap: 12px;
            align-items: flex-start;
          "
        >
          <span style="font-size: 20px; line-height: 1">💡</span>
          <div style="font-size: 12.5px; color: #0f5238; line-height: 1.5">
            <strong>Tips Keuangan Keluarga Baru:</strong> Dengan penghasilan bulanan 7.8 juta,
            target Tabungan wajib 2 juta langsung diamankan di awal bulan. Riwayat anggaran di atas
            membantu memantau konsistensi amplop belanja Anda berdua.
          </div>
        </div>

        <!-- Detailed Period Table -->
        <div
          style="
            background: white;
            border: 1px solid #bfc9c1;
            border-radius: 16px;
            overflow: hidden;
            margin-bottom: 24px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.01);
          "
        >
          <div
            style="
              padding: 16px;
              border-bottom: 1px solid #bfc9c1;
              font-weight: 800;
              color: #161a32;
              font-size: 14px;
            "
          >
            Tabel Rincian Periode
          </div>
          <div style="overflow-x: auto">
            <table
              style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left"
            >
              <thead>
                <tr
                  style="
                    background: #f3f1e9;
                    border-bottom: 1px solid #bfc9c1;
                    color: #404943;
                    font-weight: 700;
                  "
                >
                  <th style="padding: 12px 16px">Periode</th>
                  <th style="padding: 12px 16px; text-align: right">Anggaran</th>
                  <th style="padding: 12px 16px; text-align: right">Terpakai</th>
                  <th style="padding: 12px 16px; text-align: right">Sisa (Tabungan)</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="p in periodsData"
                  :key="p.id"
                  style="border-bottom: 1px solid #e3e8e4; color: #161a32"
                >
                  <td style="padding: 12px 16px; font-weight: 600">{{ p.name }}</td>
                  <td
                    style="
                      padding: 12px 16px;
                      text-align: right;
                      font-family: &quot;Inter&quot;, sans-serif;
                    "
                  >
                    {{ formatRp(parseFloat(p.totalAllocated)) }}
                  </td>
                  <td
                    style="
                      padding: 12px 16px;
                      text-align: right;
                      font-family: &quot;Inter&quot;, sans-serif;
                    "
                  >
                    {{ formatRp(parseFloat(p.totalSpent)) }}
                  </td>
                  <td
                    style="
                      padding: 12px 16px;
                      text-align: right;
                      font-weight: 700;
                      color: #0f5238;
                      font-family: &quot;Inter&quot;, sans-serif;
                    "
                  >
                    {{ formatRp(parseFloat(p.totalRemaining)) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Tab 2: Perbandingan Amplop (Category View) -->
      <div v-else-if="activeTab === 'category'" class="animate-in">
        <div
          v-if="categoriesData.length === 0"
          style="text-align: center; padding: 24px; color: #707973"
        >
          Belum ada data alokasi amplop yang tercatat.
        </div>

        <div v-else>
          <!-- Category list with interactive visual Sparklines -->
          <EnvelopeSparklineCard
            v-for="cat in categoriesData"
            :key="cat.name"
            :category="cat"
            :periods-data="periodsData"
          />
        </div>
      </div>

      <!-- Tab 3: Log Rollover -->
      <div v-else-if="activeTab === 'rollover'" class="animate-in">
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
              <option v-for="p in periodsData" :key="p.id" :value="p.id">{{ p.name }}</option>
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
                    font-family: &quot;Inter&quot;, sans-serif;
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
                    font-family: &quot;Inter&quot;, sans-serif;
                  "
                >
                  {{ formatRp(parseFloat(log.rolledOverAmount)) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7Page, f7Navbar, f7NavTitle, f7Preloader, f7NavLeft, f7Link } from "framework7-vue";
import { periods } from "../js/api";
import { formatRp } from "../js/routes";

const props = defineProps<{
  f7router: any;
}>();

const goBack = () => {
  props.f7router.back();
};

// Modular UI Components
import PeriodTrendChart from "../components/PeriodTrendChart.vue";
import EnvelopeSparklineCard from "../components/EnvelopeSparklineCard.vue";

const loading = ref(true);
const activeTab = ref<"trend" | "category" | "rollover">("trend");

interface PeriodTotal {
  id: string;
  year: number;
  month: number;
  name: string;
  totalAllocated: string;
  totalSpent: string;
  totalRemaining: string;
}

interface CategoryCompare {
  name: string;
  color: string;
  history: Array<{
    periodId: string;
    allocated: string;
    spent: string;
  }>;
}

const periodsData = ref<PeriodTotal[]>([]);
const categoriesData = ref<CategoryCompare[]>([]);

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

const loadPeriodSummary = async () => {
  try {
    const res = await periods.compare();
    periodsData.value = res.periods;
    categoriesData.value = res.categories;
    if (res.periods && res.periods.length > 0) {
      selectedPeriodId.value = res.periods[0].id;
      fetchRolloverLogs();
    }
  } catch (err) {
    console.error("Gagal mengambil data perbandingan periode:", err);
  } finally {
    loading.value = false;
  }
};

// Averages computation
const averageSaving = computed(() => {
  if (periodsData.value.length === 0) return 0;
  const totalRemaining = periodsData.value.reduce(
    (sum, p) => sum + parseFloat(p.totalRemaining),
    0
  );
  return totalRemaining / periodsData.value.length;
});

const savingRatePct = computed(() => {
  if (periodsData.value.length === 0) return 0;
  const totalAllocated = periodsData.value.reduce(
    (sum, p) => sum + parseFloat(p.totalAllocated),
    0
  );
  const totalRemaining = periodsData.value.reduce(
    (sum, p) => sum + parseFloat(p.totalRemaining),
    0
  );
  if (totalAllocated === 0) return 0;
  return Math.round((totalRemaining / totalAllocated) * 100);
});
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
