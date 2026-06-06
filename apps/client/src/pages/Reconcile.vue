<template>
  <f7-page name="reconcile" @page:beforein="loadReconcileData">
    <f7-navbar>
      <f7-nav-left>
        <f7-link
          icon-only
          @click="handleNavbarBack"
          style="display: flex; align-items: center; gap: 4px; color: var(--fintr-primary)"
        >
          <span class="material-symbols-outlined" style="font-size: 24px">arrow_back</span>
          <span class="if-not-md" style="font-size: 16px; font-weight: 600">Kembali</span>
        </f7-link>
      </f7-nav-left>
      <f7-nav-title class="font-headline">Rekonsiliasi Saldo Mingguan</f7-nav-title>
    </f7-navbar>

    <div v-if="loading" style="text-align: center; padding: 48px">
      <f7-preloader size="42" color="green"></f7-preloader>
      <div style="margin-top: 16px; color: var(--fintr-text-muted)">Memuat kalkulasi saldo...</div>
    </div>

    <div v-else style="padding: 16px">
      <!-- Info Card -->
      <div
        class="animate-in"
        style="
          background: #ffffff;
          border: 1px solid #bfc9c1;
          border-radius: 20px;
          padding: 24px 20px;
          margin-bottom: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
        "
      >
        <div
          style="
            font-size: 13px;
            color: var(--fintr-text-muted);
            margin-bottom: 4px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          "
        >
          Saldo Tercatat di FamiVault
        </div>
        <div
          class="font-headline"
          style="
            font-size: 30px;
            font-weight: 800;
            color: #0f5238;
            letter-spacing: -0.02em;
            margin-bottom: 20px;
          "
        >
          {{ formatRp(reconcileDiff?.expectedBalance || 0) }}
        </div>

        <div
          style="
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            margin-bottom: 10px;
            border-bottom: 1px dashed #bfc9c1;
            padding-bottom: 10px;
          "
        >
          <span style="color: var(--fintr-text-muted)">Saldo Awal Periode:</span>
          <span style="font-weight: 700; color: #161a32">{{
            formatRp(reconcileDiff?.openingBalance || 0)
          }}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 13px">
          <span style="color: var(--fintr-text-muted)">Total Pengeluaran:</span>
          <span style="font-weight: 700; color: var(--fintr-danger)">
            -{{ formatRp(reconcileDiff?.totalSpent || 0) }}
          </span>
        </div>
      </div>

      <!-- Snapshot Input Form -->
      <div
        class="animate-in"
        style="
          background: #ffffff;
          border: 1px solid #bfc9c1;
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
        "
      >
        <div
          class="font-headline"
          style="font-size: 16px; font-weight: 800; color: #161a32; margin-bottom: 16px"
        >
          Ambil Snapshot Saldo Aktual
        </div>

        <div style="margin-bottom: 16px">
          <div
            style="
              font-size: 12px;
              color: var(--fintr-text-muted);
              margin-bottom: 8px;
              font-weight: 600;
            "
          >
            Saldo Riil / Fisik Saat Ini (Total Semua Rekening & Dompet)
          </div>
          <input
            type="number"
            class="fintr-input"
            v-model="form.actualBalance"
            placeholder="Masukkan saldo riil..."
            style="
              background: #f3f1e9;
              border: 1px solid #bfc9c1;
              color: #161a32;
              padding: 12px;
              border-radius: 10px;
              width: 100%;
              box-sizing: border-box;
              font-size: 14px;
            "
            @input="handleActualBalanceInput"
          />
        </div>

        <!-- Tautan kalkulator pecahan dompet -->
        <div style="margin-top: 10px; margin-bottom: 16px">
          <button
            type="button"
            @click="toggleCalculator"
            style="
              background: none;
              border: none;
              color: #0f5238;
              font-size: 13px;
              font-weight: 700;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 6px;
              padding: 0;
            "
          >
            <span class="material-symbols-outlined" style="font-size: 18px">
              {{ showCalculator ? "keyboard_arrow_up" : "calculate" }}
            </span>
            {{ showCalculator ? "Sembunyikan Rincian Dompet" : "🧮 Hitung dari Beberapa Dompet" }}
          </button>
        </div>

        <!-- Collapsible Calculator Section -->
        <div
          v-if="showCalculator"
          class="animate-in"
          style="
            background: #fdfdfb;
            border: 1px solid #bfc9c1;
            border-radius: 16px;
            padding: 16px;
            margin-bottom: 16px;
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
          "
        >
          <div
            style="
              font-size: 12px;
              font-weight: 700;
              color: #0f5238;
              margin-bottom: 12px;
              display: flex;
              align-items: center;
              gap: 4px;
            "
          >
            <span class="material-symbols-outlined" style="font-size: 16px"
              >account_balance_wallet</span
            >
            Pecah Saldo per Rekening / Dompet
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px">
            <div
              v-for="(wallet, idx) in wallets"
              :key="idx"
              style="
                background: #f8faf9;
                border: 1px solid #dde4de;
                border-radius: 10px;
                padding: 10px 12px;
                display: flex;
                flex-direction: column;
                gap: 8px;
              "
            >
              <!-- Baris 1: Label nama dompet -->
              <input
                type="text"
                class="wallet-label-input"
                v-model="wallet.label"
                placeholder="Nama Dompet (e.g. BRI, Dompet Tunai)"
                @input="syncCalculator"
              />
              <!-- Baris 2: Input jumlah + tombol hapus -->
              <div style="display: flex; gap: 8px; align-items: center">
                <div style="position: relative; flex: 1">
                  <span
                    style="
                      position: absolute;
                      left: 10px;
                      top: 50%;
                      transform: translateY(-50%);
                      font-size: 12px;
                      font-weight: 700;
                      color: var(--fintr-text-muted);
                      pointer-events: none;
                      z-index: 1;
                    "
                    >Rp</span
                  >
                  <input
                    type="number"
                    class="wallet-amount-input"
                    v-model="wallet.amount"
                    placeholder="0"
                    @input="syncCalculator"
                  />
                </div>
                <button
                  type="button"
                  @click="removeWallet(idx)"
                  style="
                    background: #fff0f0;
                    border: 1px solid #f5c6c6;
                    color: var(--fintr-danger);
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                  "
                >
                  <span class="material-symbols-outlined" style="font-size: 16px">delete</span>
                </button>
              </div>
            </div>
          </div>

          <div
            style="
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-top: 12px;
            "
          >
            <button
              type="button"
              @click="addWallet"
              style="
                background: #e8ede9;
                border: none;
                color: #0f5238;
                padding: 6px 12px;
                border-radius: 8px;
                font-size: 11px;
                font-weight: 700;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 4px;
              "
            >
              <span class="material-symbols-outlined" style="font-size: 14px">add</span>
              Tambah Baris
            </button>

            <div style="font-size: 12px; font-weight: 700; color: #161a32">
              Total: {{ formatRp(calculatorTotal) }}
            </div>
          </div>

          <!-- Auto-copy note option -->
          <div
            style="
              margin-top: 14px;
              padding-top: 10px;
              border-top: 1px dashed #bfc9c1;
              display: flex;
              align-items: center;
              gap: 8px;
            "
          >
            <input
              type="checkbox"
              id="autoNoteCheckbox"
              v-model="autoNoteEnabled"
              @change="updateAutoNote"
              style="accent-color: #0f5238; cursor: pointer"
            />
            <label
              for="autoNoteCheckbox"
              style="font-size: 11px; color: #707973; font-weight: 600; cursor: pointer"
            >
              Simpan rincian ini ke Catatan Snapshot
            </label>
          </div>
        </div>

        <!-- Calculated Live Diff -->
        <div
          v-if="form.actualBalance !== ''"
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            background: #f3f1e9;
            border-radius: 12px;
            margin-bottom: 16px;
            border: 1px solid #bfc9c1;
          "
        >
          <span style="font-size: 13px; color: var(--fintr-text-muted); font-weight: 600"
            >Selisih Keuangan:</span
          >
          <span
            :style="{
              fontSize: '15px',
              fontWeight: 800,
              color: computedDiff >= 0 ? 'var(--fintr-success)' : 'var(--fintr-danger)',
            }"
          >
            {{ computedDiff >= 0 ? "+" : "" }}{{ formatRp(computedDiff) }}
          </span>
        </div>

        <!-- Dynamic Contextual Guidance -->
        <div
          v-if="form.actualBalance !== ''"
          class="animate-in"
          style="
            padding: 16px;
            border-radius: 12px;
            margin-bottom: 16px;
            font-size: 13px;
            line-height: 1.5;
          "
          :style="{
            background: computedDiff === 0 ? '#e8f5e9' : computedDiff > 0 ? '#e0f2f1' : '#fbe9e7',
            border:
              computedDiff === 0
                ? '1px solid #a5d6a7'
                : computedDiff > 0
                  ? '1px solid #80cbc4'
                  : '1px solid #ffccbc',
            color: computedDiff === 0 ? '#1b5e20' : computedDiff > 0 ? '#004d40' : '#b71c1c',
          }"
        >
          <div
            style="
              font-weight: 700;
              margin-bottom: 6px;
              display: flex;
              align-items: center;
              gap: 6px;
            "
          >
            <span class="material-symbols-outlined" style="font-size: 18px">
              {{
                computedDiff === 0 ? "check_circle" : computedDiff > 0 ? "add_circle" : "warning"
              }}
            </span>
            <span>
              {{
                computedDiff === 0
                  ? "Catatan Seimbang (Perfect Match)"
                  : computedDiff > 0
                    ? "Kelebihan Saldo Aktual (+)"
                    : "Kekurangan Saldo Aktual (-)"
              }}
            </span>
          </div>
          <div>
            {{
              computedDiff === 0
                ? "Hebat! Saldo riil Anda persis sama dengan pencatatan di FamiVault. Tidak ada selisih yang perlu disesuaikan."
                : computedDiff > 0
                  ? "Uang fisik lebih besar dari catatan digital. Ini biasanya karena ada pemasukan/kembalian yang belum dicatat, atau pengeluaran yang dicatat terlalu besar. Periksa riwayat mutasi bank Anda."
                  : "Uang fisik kurang dari catatan digital. Ini terjadi karena ada pengeluaran kecil (seperti parkir/kembalian kurang) yang lupa dicatat, atau ada transaksi offline yang belum terunggah. Catat transaksi penyesuaian jika selisih tidak ditemukan."
            }}
          </div>
        </div>

        <div style="margin-bottom: 20px">
          <div
            style="
              font-size: 12px;
              color: var(--fintr-text-muted);
              margin-bottom: 8px;
              font-weight: 600;
            "
          >
            Catatan Snapshot
          </div>
          <input
            type="text"
            class="fintr-input"
            v-model="form.note"
            placeholder="e.g. Cocok setelah BRImo ditarik ATM"
            style="
              background: #f3f1e9;
              border: 1px solid #bfc9c1;
              color: #161a32;
              padding: 12px;
              border-radius: 10px;
              width: 100%;
              box-sizing: border-box;
              font-size: 14px;
            "
          />
        </div>

        <button class="btn-primary" :disabled="submitting" @click="submitSnapshot">
          {{ submitting ? "Menyimpan..." : "Simpan Snapshot Saldo" }}
        </button>
      </div>

      <!-- History of snapshots -->
      <div
        class="block-title font-headline animate-in"
        style="margin: 16px 0 8px; font-size: 15px; font-weight: 800; color: #161a32"
      >
        Riwayat Snapshot Saldo
      </div>

      <div
        v-if="historyList.length === 0"
        class="empty-state animate-in"
        style="
          margin: 0 16px 16px;
          background: white;
          border: 1px solid #bfc9c1;
          border-radius: 16px;
          padding: 32px;
          text-align: center;
        "
      >
        <div style="font-size: 48px; margin-bottom: 16px">📊</div>
        <div style="font-size: 15px; font-weight: 700; color: #161a32; margin-bottom: 8px">
          Belum Ada Riwayat Rekonsiliasi
        </div>
        <div style="font-size: 12px; color: #707973; line-height: 1.6">
          Rekonsiliasi saldo mencocokkan jumlah uang riil Anda (di dompet/rekening) dengan saldo
          digital di aplikasi. Lakukan secara berkala untuk menjaga akurasi catatan keuangan.
        </div>
      </div>

      <div v-else style="display: flex; flex-direction: column; gap: 12px" class="animate-in">
        <div
          v-for="h in historyList"
          :key="h.id"
          @click="toggleExpandSnapshot(h.id)"
          style="
            background: #ffffff;
            border: 1px solid #bfc9c1;
            border-radius: 16px;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
            transition: all 0.2s ease;
            cursor: pointer;
          "
          :style="{
            borderColor: expandedSnapshots[h.id] ? '#0f5238' : '#bfc9c1',
            background: expandedSnapshots[h.id] ? '#f8faf9' : '#ffffff',
          }"
        >
          <!-- Row Utama -->
          <div
            style="
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              width: 100%;
            "
          >
            <!-- Left: User Avatar Initials and Info -->
            <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0">
              <div
                style="
                  width: 40px;
                  height: 40px;
                  border-radius: 50%;
                  background: #e8ede9;
                  color: #0f5238;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: 700;
                  font-size: 14px;
                  flex-shrink: 0;
                  border: 1.5px solid #0f5238;
                  text-transform: uppercase;
                  overflow: hidden;
                "
              >
                <img
                  v-if="h.creatorAvatar"
                  :src="h.creatorAvatar"
                  style="width: 100%; height: 100%; object-fit: cover"
                />
                <span v-else>{{ h.creatorName ? h.creatorName.substring(0, 2) : "US" }}</span>
              </div>

              <div style="flex: 1; min-width: 0">
                <div
                  style="
                    font-size: 15px;
                    font-weight: 700;
                    color: #161a32;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                  "
                >
                  {{ formatRp(h.actualBalance) }}
                </div>
                <div
                  style="
                    font-size: 12px;
                    color: #707973;
                    margin-top: 2px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                  "
                  v-if="!expandedSnapshots[h.id]"
                >
                  {{ h.note || "Snapshot Saldo" }}
                </div>
                <div
                  style="font-size: 12px; color: #707973; margin-top: 2px; font-weight: 600"
                  v-else-if="!parseNoteDetails(h.note)"
                >
                  {{ h.note || "Snapshot Saldo" }}
                </div>
              </div>
            </div>

            <!-- Right: Date and Creator Badge -->
            <div
              style="
                text-align: right;
                flex-shrink: 0;
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                gap: 4px;
              "
            >
              <span
                style="
                  font-size: 11px;
                  color: #707973;
                  font-weight: 500;
                  display: flex;
                  align-items: center;
                  gap: 4px;
                "
              >
                {{ formatDate(h.snapshotAt) }}
                <span
                  class="material-symbols-outlined"
                  style="font-size: 14px; transition: transform 0.2s"
                  :style="{
                    transform: expandedSnapshots[h.id] ? 'rotate(180deg)' : 'rotate(0deg)',
                  }"
                >
                  expand_more
                </span>
              </span>
              <div
                style="
                  font-size: 10px;
                  font-weight: 700;
                  background: #f0f4f1;
                  color: #0f5238;
                  padding: 2px 8px;
                  border-radius: 20px;
                  border: 1px solid #c9d6cb;
                  max-width: 100px;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                "
              >
                👤 {{ h.creatorName || "Pengguna" }}
              </div>
            </div>
          </div>

          <!-- Bagian Detail Koin / Rincian Dompet (muncul saat di-expand) -->
          <div
            v-if="expandedSnapshots[h.id] && parseNoteDetails(h.note)"
            class="animate-in"
            style="
              margin-top: 4px;
              padding: 10px 12px;
              background: #f3f6f4;
              border-radius: 10px;
              border: 1px solid #c9d6cb;
              display: flex;
              flex-direction: column;
              gap: 6px;
            "
            @click.stop
          >
            <div
              style="
                font-size: 10px;
                font-weight: 700;
                color: #707973;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              "
            >
              Rincian Dompet Fisik
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px">
              <div
                v-for="(item, i) in parseNoteDetails(h.note)"
                :key="i"
                style="
                  background: #ffffff;
                  border: 1px solid #bfc9c1;
                  padding: 4px 10px;
                  border-radius: 8px;
                  font-size: 11px;
                  font-weight: 600;
                  color: #161a32;
                  display: flex;
                  align-items: center;
                  gap: 4px;
                "
              >
                <span style="color: #707973">{{ item.label }}:</span>
                <span style="color: #0f5238; font-weight: 700">{{ item.value }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from "vue";
import { f7Page, f7Navbar, f7Preloader, f7, f7NavLeft, f7Link, f7NavTitle } from "framework7-vue";
import { reconcile } from "../js/api";
import { formatRp } from "../js/routes";
import { useBackButton } from "../composables/useBackButton";

const props = defineProps<{
  f7router: any;
}>();

const goBack = () => {
  props.f7router.back();
};

const loading = ref(true);
const submitting = ref(false);
const reconcileDiff = ref<any>(null);
const historyList = ref<any[]>([]);
const computedDiff = ref(0);

const form = reactive({
  actualBalance: "" as number | "",
  note: "",
});

const showCalculator = ref(false);
const wallets = ref<Array<{ label: string; amount: number | "" }>>([
  { label: "Tabungan Utama", amount: "" },
  { label: "Dompet Tunai", amount: "" },
  { label: "E-Wallet/QRIS", amount: "" },
]);
const autoNoteEnabled = ref(true);
const calculatorTotal = ref(0);

const toggleCalculator = () => {
  showCalculator.value = !showCalculator.value;
};

const addWallet = () => {
  wallets.value.push({ label: "", amount: "" });
};

const removeWallet = (index: number) => {
  wallets.value.splice(index, 1);
  syncCalculator();
};

const syncCalculator = () => {
  let total = 0;
  wallets.value.forEach(w => {
    if (w.amount !== "" && !isNaN(w.amount)) {
      total += Number(w.amount);
    }
  });
  calculatorTotal.value = total;
  form.actualBalance = total > 0 ? total : "";
  calculateDiff();
  updateAutoNote();
};

const formatRpShort = (val: number) => {
  if (val >= 1000000) {
    const jt = val / 1000000;
    return `${jt % 1 === 0 ? jt : jt.toFixed(1)}jt`;
  }
  if (val >= 1000) {
    const rb = val / 1000;
    return `${rb % 1 === 0 ? rb : rb.toFixed(1)}rb`;
  }
  return val.toString();
};

const updateAutoNote = () => {
  if (!autoNoteEnabled.value) return;
  const activeWallets = wallets.value.filter(w => w.amount !== "" && Number(w.amount) > 0);
  if (activeWallets.length === 0) {
    form.note = "";
    return;
  }
  const details = activeWallets
    .map(w => `${w.label || "Lainnya"}: ${formatRpShort(Number(w.amount))}`)
    .join(", ");
  form.note = `Rincian: ${details}`;
};

const handleActualBalanceInput = () => {
  calculateDiff();
  if (showCalculator.value) {
    wallets.value.forEach(w => {
      w.amount = "";
    });
    calculatorTotal.value = 0;
  }
};

let initialBalance: number | "" = "";
const initialNote = "";

const expandedSnapshots = ref<Record<string, boolean>>({});

const toggleExpandSnapshot = (id: string) => {
  expandedSnapshots.value[id] = !expandedSnapshots.value[id];
};

const parseNoteDetails = (note: string | null) => {
  if (!note) return null;
  if (!note.startsWith("Rincian:")) return null;

  const cleanStr = note.substring("Rincian:".length).trim();
  const parts = cleanStr.split(",");
  return parts.map(p => {
    const lastColonIdx = p.lastIndexOf(":");
    if (lastColonIdx === -1) return { label: p.trim(), value: "" };
    return {
      label: p.substring(0, lastColonIdx).trim(),
      value: p.substring(lastColonIdx + 1).trim(),
    };
  });
};

const loadReconcileData = async () => {
  try {
    const [diff, history] = await Promise.all([reconcile.diff(), reconcile.history()]);
    reconcileDiff.value = diff;
    historyList.value = history;
    if (diff.actualBalance) {
      form.actualBalance = parseFloat(diff.actualBalance);
      initialBalance = form.actualBalance;
      calculateDiff();
    } else {
      form.actualBalance = "";
      initialBalance = "";
    }
  } catch (err: any) {
    // If no active period or error
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const calculateDiff = () => {
  if (form.actualBalance === "" || !reconcileDiff.value) {
    computedDiff.value = 0;
    return;
  }
  const expected = parseFloat(reconcileDiff.value.expectedBalance || "0");
  computedDiff.value = Number(form.actualBalance) - expected;
};

const submitSnapshot = async () => {
  if (form.actualBalance === "") {
    f7.dialog.alert("Masukkan nilai saldo aktual", "Oops");
    return;
  }

  submitting.value = true;
  try {
    await reconcile.snapshot({
      actualBalance: Number(form.actualBalance),
      note: form.note || undefined,
    });
    f7.toast
      .create({
        text: "Snapshot saldo berhasil disimpan! 📊",
        closeTimeout: 2000,
      })
      .open();
    form.note = "";
    wallets.value.forEach(w => {
      w.amount = "";
    });
    calculatorTotal.value = 0;
    showCalculator.value = false;
    loadReconcileData();
  } catch (err: any) {
    f7.dialog.alert("Gagal menyimpan: " + err.message);
  } finally {
    submitting.value = false;
  }
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const isDirty = () => {
  return form.actualBalance !== initialBalance || form.note !== initialNote;
};

const handleNavbarBack = () => {
  if (isDirty()) {
    f7.dialog.confirm(
      "Ada perubahan belum disimpan. Batalkan rekonsiliasi?",
      "Batal Rekonsiliasi?",
      () => {
        goBack();
      }
    );
  } else {
    goBack();
  }
};

const { registerHandler } = useBackButton();
let unregisterBack: (() => void) | null = null;

onMounted(() => {
  unregisterBack = registerHandler(10, () => {
    if (isDirty()) {
      f7.dialog.confirm(
        "Ada perubahan belum disimpan. Batalkan rekonsiliasi?",
        "Batal Rekonsiliasi?",
        () => {
          if (unregisterBack) unregisterBack();
          goBack();
        }
      );
      return true; // handled
    }
    return false; // propagate
  });
});

onBeforeUnmount(() => {
  if (unregisterBack) {
    unregisterBack();
  }
});
</script>
