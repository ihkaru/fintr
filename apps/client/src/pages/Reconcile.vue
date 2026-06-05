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
            Saldo Riil / Fisik Saat Ini (Tabungan BRI + Dompet Cash + QRIS)
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
            @input="calculateDiff"
          />
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
        style="background: white; border: 1px solid #bfc9c1; border-radius: 16px; padding: 32px"
      >
        <div class="icon">📊</div>
        <div class="message">Belum ada riwayat snapshot saldo.</div>
      </div>

      <f7-list
        v-else
        media-list
        class="no-margin animate-in"
        style="border-radius: 16px; border: 1px solid #bfc9c1; overflow: hidden; background: white"
      >
        <f7-list-item
          v-for="h in historyList"
          :key="h.id"
          :title="formatRp(h.actualBalance)"
          :subtitle="h.note || 'Snapshot Saldo'"
          :text="formatDate(h.snapshotAt)"
        ></f7-list-item>
      </f7-list>
    </div>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from "vue";
import {
  f7Page,
  f7Navbar,
  f7Preloader,
  f7List,
  f7ListItem,
  f7,
  f7NavLeft,
  f7Link,
  f7NavTitle,
} from "framework7-vue";
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

let initialBalance: number | "" = "";
let initialNote = "";

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
