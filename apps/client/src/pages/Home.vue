<template>
  <f7-page name="home" @page:beforein="triggerLoadDashboard" @page:tabshow="triggerLoadDashboard">
    <f7-navbar>
      <f7-nav-title class="font-headline">FamiVault</f7-nav-title>
      <f7-nav-right>
        <f7-link href="/settings/" icon-only>
          <span
            class="material-symbols-outlined"
            style="font-size: 24px; color: var(--fintr-primary)"
            >settings</span
          >
        </f7-link>
      </f7-nav-right>
    </f7-navbar>

    <!-- Content -->
    <div v-if="loading" style="text-align: center; padding: 48px">
      <f7-preloader size="42" color="green"></f7-preloader>
      <div style="margin-top: 16px; color: var(--fintr-text-muted)">Menuat dasbor FamiVault...</div>
    </div>

    <div v-else>
      <!-- Couple/Partner Active Status Bar -->
      <PartnerStatusBar
        :user="currentUserProfile"
        :partner="partnerProfile"
        :household-name="householdName"
      />

      <!-- Failed Offline Transactions Warning Banner -->
      <div
        v-if="failedQueue.length > 0"
        style="
          margin: 12px 16px 4px;
          background: #fdf2f2;
          border: 1px solid #f8b4b4;
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        "
      >
        <div style="display: flex; align-items: center; gap: 8px; flex: 1">
          <span class="material-symbols-outlined" style="color: #f05252; font-size: 24px"
            >warning</span
          >
          <div style="font-size: 13px; color: #9b1c1c; font-weight: 500; line-height: 1.4">
            Ada <strong>{{ failedQueue.length }}</strong> pengeluaran offline yang gagal diunggah.
          </div>
        </div>
        <button
          @click="failedSheetOpened = true"
          style="
            background: #f05252;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(240, 82, 82, 0.2);
          "
        >
          Tinjau
        </button>
      </div>

      <!-- Hero Stats Card -->
      <BudgetHeroCard
        :remaining="summary.remaining"
        :allocated="summary.allocated"
        :spent="summary.spent"
      />

      <!-- Budget Optimization Nudge -->
      <div
        v-if="isNudgeActive"
        style="
          margin: 0 16px 12px;
          background: #fefcf0;
          border: 1px solid #f9e6a9;
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
          display: flex;
          flex-direction: column;
          gap: 12px;
        "
      >
        <div style="display: flex; gap: 12px; align-items: flex-start">
          <span style="font-size: 24px; line-height: 1">💡</span>
          <div style="flex: 1">
            <div style="font-size: 14px; font-weight: 800; color: #7f5c01; margin-bottom: 4px">
              Optimalisasi Anggaran Terdeteksi!
            </div>
            <div style="font-size: 13px; color: #5d480e; line-height: 1.5">
              Amplop <strong>'Lain-lain'</strong> mendominasi pengeluaran Anda bulan ini (60%+).
              Ingin memecahnya ke amplop baru agar anggaran lebih terpantau?
            </div>
            <div style="font-size: 12px; color: #7f5c01; font-weight: 600; margin-top: 6px">
              Rekomendasi nama amplop:
              <span
                style="background: #fceea7; padding: 2px 6px; border-radius: 6px; font-weight: 700"
                >"{{ suggestedEnvelopeName }}"</span
              >
            </div>
          </div>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 8px">
          <button
            @click="dismissNudge"
            style="
              background: transparent;
              color: #707973;
              border: none;
              padding: 8px 16px;
              border-radius: 8px;
              font-size: 12px;
              font-weight: 700;
              cursor: pointer;
            "
          >
            Nanti Saja
          </button>
          <button
            @click="openNudgeEnvelopeSheet"
            style="
              background: #0f5238;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 8px;
              font-size: 12px;
              font-weight: 700;
              cursor: pointer;
              box-shadow: 0 2px 4px rgba(15, 82, 56, 0.2);
            "
          >
            Pecah Amplop
          </button>
        </div>
      </div>

      <!-- Budget Analytics Shortcut -->
      <div
        style="
          margin: 0 16px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #ffffff;
          border: 1px solid #bfc9c1;
          border-radius: 16px;
          padding: 12px 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.01);
        "
      >
        <div style="display: flex; align-items: center; gap: 12px">
          <span style="font-size: 20px">📊</span>
          <div>
            <div style="font-size: 13px; font-weight: 700; color: #161a32">
              Analisis & Tren Anggaran
            </div>
            <div style="font-size: 11px; color: #707973">
              Lihat riwayat perbandingan antar periode
            </div>
          </div>
        </div>
        <f7-link
          href="/period-summary/"
          style="
            font-size: 12px;
            font-weight: 700;
            color: #0f5238;
            border: 1px solid #0f5238;
            padding: 4px 12px;
            border-radius: 8px;
          "
          >Buka</f7-link
        >
      </div>

      <!-- Envelope Grid -->
      <div class="section-header" style="padding: 12px 20px 8px">
        <div class="title font-headline" style="font-size: 17px; font-weight: 800; color: #161a32">
          Amplop Anggaran Pasangan
        </div>
        <f7-link
          href="/envelopes/"
          class="action"
          style="font-size: 13px; font-weight: 700; color: #0f5238"
          >Semua →</f7-link
        >
      </div>

      <div
        v-if="allocationsData.length === 0"
        class="empty-state"
        style="
          margin: 16px;
          background: white;
          border: 1px solid #bfc9c1;
          border-radius: 16px;
          padding: 32px;
          text-align: center;
        "
      >
        <div style="font-size: 48px; margin-bottom: 16px">📦</div>
        <div style="font-size: 15px; font-weight: 700; color: #161a32; margin-bottom: 8px">
          Belum Ada Amplop Aktif
        </div>
        <div style="font-size: 12px; color: #707973; margin-bottom: 20px; line-height: 1.6">
          Amplop digunakan untuk membagi anggaran belanja rumah tangga ke pos-pos tertentu agar
          pengeluaran terkendali bersama pasangan.
        </div>
        <f7-link
          href="/envelopes/"
          style="
            display: inline-block;
            font-size: 13px;
            font-weight: 700;
            color: white;
            background: #0f5238;
            padding: 10px 24px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(15, 82, 56, 0.2);
          "
        >
          Buat Amplop Pertama
        </f7-link>
      </div>

      <div v-else class="envelope-grid" style="padding: 0 16px">
        <EnvelopeCard
          v-for="(a, idx) in allocationsData"
          :key="a.id"
          :allocation="a"
          :delay="idx * 0.05"
          @click="openAddTransactionWithEnvelope(a.id)"
        />
      </div>

      <!-- Recent Transactions -->
      <div class="section-header" style="margin-top: 16px; padding: 12px 20px 8px">
        <div class="title font-headline" style="font-size: 17px; font-weight: 800; color: #161a32">
          Pengeluaran Terakhir
        </div>
        <f7-link
          href="/transactions/"
          class="action"
          style="font-size: 13px; font-weight: 700; color: #0f5238"
          >Semua →</f7-link
        >
      </div>

      <div
        v-if="recentTxns.length === 0"
        class="empty-state"
        style="
          margin: 16px;
          background: white;
          border: 1px solid #bfc9c1;
          border-radius: 16px;
          padding: 32px;
          text-align: center;
        "
      >
        <div style="font-size: 48px; margin-bottom: 16px">📝</div>
        <div style="font-size: 15px; font-weight: 700; color: #161a32; margin-bottom: 8px">
          Belum Ada Catatan Transaksi
        </div>
        <div style="font-size: 12px; color: #707973; margin-bottom: 20px; line-height: 1.6">
          Mulai catat setiap pengeluaran rumah tangga secara real-time untuk melihat sisa saldo
          amplop anggaran terupdate secara instan.
        </div>
        <f7-link
          @click="navigateToAddTransaction"
          style="
            display: inline-block;
            font-size: 13px;
            font-weight: 700;
            color: white;
            background: #0f5238;
            padding: 10px 24px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(15, 82, 56, 0.2);
          "
        >
          ✍️ Catat Pengeluaran Pertama
        </f7-link>
      </div>

      <div v-else id="recent-transactions" style="padding: 0 16px">
        <TransactionRow
          v-for="txn in recentTxns"
          :key="txn.id"
          :transaction="txn"
          @click="showTransactionDetail(txn)"
        />
      </div>

      <!-- Reconcile Widget -->
      <div class="section-header" style="margin-top: 16px; padding: 12px 20px 8px">
        <div class="title font-headline" style="font-size: 17px; font-weight: 800; color: #161a32">
          Rekonsiliasi Saldo Mingguan
        </div>
        <f7-link
          href="/reconcile/"
          class="action"
          style="font-size: 13px; font-weight: 700; color: #0f5238"
          >Detail →</f7-link
        >
      </div>

      <ReconcileWidget :reconcile-data="reconcileData" />
    </div>

    <!-- Add Transaction FAB -->
    <button
      class="fab-custom"
      @click="navigateToAddTransaction"
      style="font-size: 32px; font-weight: 300"
    >
      +
    </button>

    <!-- Detail Transaction Bottom Sheet -->
    <TransactionDetailSheet
      v-model:opened="detailOpened"
      :transaction="selectedTransaction"
      @delete="deleteTxn"
    />

    <!-- Failed Transactions Sheet -->
    <FailedQueueSheet
      v-model:opened="failedSheetOpened"
      :failed-queue="failedQueue"
      :friendly-error="friendlyError"
      :get-split-total="getSplitTotal"
      @remove="onRemoveFailed"
      @retry="onRetryFailed"
      @clear-all="onClearAllFailed"
    />

    <!-- Nudge Create Envelope Sheet -->
    <NudgeEnvelopeSheet
      v-model:opened="nudgeSheetOpened"
      :nudge-envelope-form="nudgeEnvelopeForm"
      :nudge-color-presets="nudgeColorPresets"
      :creating-nudge-envelope="creatingNudgeEnvelope"
      @update-form="Object.assign(nudgeEnvelopeForm, $event)"
      @submit="handleCreateNudgeEnvelope"
    />
  </f7-page>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";
import {
  f7Page,
  f7Navbar,
  f7NavTitle,
  f7NavRight,
  f7Link,
  f7Preloader,
  f7ready,
  f7,
} from "framework7-vue";
import { formatRp } from "../js/routes";
import { useShareStore } from "../js/shareStore";

// Composables
import { useDashboard } from "../composables/useDashboard";
import { useNudge } from "../composables/useNudge";
import { useFailedQueue } from "../composables/useFailedQueue";

// Modular UI Components
import PartnerStatusBar from "../components/PartnerStatusBar.vue";
import BudgetHeroCard from "../components/BudgetHeroCard.vue";
import EnvelopeCard from "../components/EnvelopeCard.vue";
import TransactionRow from "../components/TransactionRow.vue";
import ReconcileWidget from "../components/ReconcileWidget.vue";
import TransactionDetailSheet from "../components/TransactionDetailSheet.vue";
import NudgeEnvelopeSheet from "../components/NudgeEnvelopeSheet.vue";
import FailedQueueSheet from "../components/FailedQueueSheet.vue";

const {
  loading,
  summary,
  allocationsData,
  recentTxns,
  reconcileData,
  currentPeriodId,
  currentUserProfile,
  partnerProfile,
  householdName,
  loadDashboard,
  navigateToAddTransaction,
  openAddTransactionWithEnvelope,
  deleteTxn,
  handleTransactionSaved,
} = useDashboard();

const {
  isNudgeActive,
  suggestedEnvelopeName,
  nudgeSheetOpened,
  creatingNudgeEnvelope,
  nudgeColorPresets,
  nudgeEnvelopeForm,
  dismissNudge,
  openNudgeEnvelopeSheet,
  handleCreateNudgeEnvelope,
  checkNudge,
} = useNudge(currentPeriodId);

const {
  failedQueue,
  failedSheetOpened,
  loadFailedQueue,
  onRemoveFailed,
  onRetryFailed,
  onClearAllFailed,
  getSplitTotal,
  friendlyError,
} = useFailedQueue();

const onDashboardLoaded = (currentPeriod: any, allocations: any[], txns: any[]) => {
  checkNudge(currentPeriod, allocations, txns);
};

const triggerLoadDashboard = () => loadDashboard(onDashboardLoaded);

const showTransactionDetail = (txn: any) => {
  selectedTransaction.value = txn;
  detailOpened.value = true;
};

// Local UI state for detail sheet
const detailOpened = ref(false);
const selectedTransaction = ref<any>(null);

onMounted(async () => {
  window.addEventListener("fintr:transaction-saved", handleTransactionSaved);
  window.addEventListener("fintr:envelope-changed", triggerLoadDashboard);
  window.addEventListener("fintr:offline-failed-changed", loadFailedQueue);

  loadFailedQueue();
  triggerLoadDashboard();

  f7ready(async () => {
    // Intercept shared receipt image or text from PWA share target and auto-redirect
    if ("caches" in window) {
      try {
        const cache = await caches.open("shared-image-cache");
        const [sharedImage, sharedText] = await Promise.all([
          cache.match("/shared-image"),
          cache.match("/shared-text"),
        ]);
        if (sharedImage || sharedText) {
          console.log("Shared PWA content detected in cache, redirecting to Add Transaction");
          if (f7.views.main && f7.views.main.router) {
            f7.views.main.router.navigate("/add-transaction/?source=share", { reloadAll: false });
          }
        }
      } catch (e) {
        console.error("Error checking shared PWA content in cache:", e);
      }
    }

    // Intercept shared data from Native share target and auto-redirect
    const { sharedData } = useShareStore();
    if (sharedData.value) {
      console.log(
        "Shared native data detected in shareStore on mount, redirecting to Add Transaction"
      );
      if (f7.views.main && f7.views.main.router) {
        f7.views.main.router.navigate("/add-transaction/?source=share", { reloadAll: false });
      }
    }
  });
});

onBeforeUnmount(() => {
  window.removeEventListener("fintr:transaction-saved", handleTransactionSaved);
  window.removeEventListener("fintr:envelope-changed", triggerLoadDashboard);
  window.removeEventListener("fintr:offline-failed-changed", loadFailedQueue);
});
</script>
