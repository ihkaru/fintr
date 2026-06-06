<template>
  <f7-page name="home" @page:beforein="loadDashboard" @page:tabshow="loadDashboard">
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

      <!-- Hero Stats Card -->
      <BudgetHeroCard
        :remaining="summary.remaining"
        :allocated="summary.allocated"
        :spent="summary.spent"
      />

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
        "
      >
        <div class="icon">📦</div>
        <div class="message">Belum ada amplop aktif.</div>
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
        "
      >
        <div class="icon">📝</div>
        <div class="message">
          Belum ada transaksi bulan ini.<br />Tap tombol + di kanan bawah untuk mencatat.
        </div>
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
  </f7-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import {
  f7Page,
  f7Navbar,
  f7NavTitle,
  f7NavRight,
  f7Link,
  f7Icon,
  f7Preloader,
  f7,
  f7ready,
} from "framework7-vue";
import {
  periods,
  transactions as txnApi,
  reconcile,
  household,
  getUser,
  PeriodDetail,
  Transaction,
} from "../js/api";
import { formatRp } from "../js/routes";
import { useShareStore } from "../js/shareStore";

// Modular UI Components
import PartnerStatusBar from "../components/PartnerStatusBar.vue";
import BudgetHeroCard from "../components/BudgetHeroCard.vue";
import EnvelopeCard from "../components/EnvelopeCard.vue";
import TransactionRow from "../components/TransactionRow.vue";
import ReconcileWidget from "../components/ReconcileWidget.vue";
import TransactionDetailSheet from "../components/TransactionDetailSheet.vue";

const loading = ref(true);
const summary = ref({
  remaining: 0,
  allocated: 0,
  spent: 0,
});
const allocationsData = ref<PeriodDetail["allocations"]>([]);
const recentTxns = ref<Transaction[]>([]);
const reconcileData = ref<any>(null);
const currentPeriodId = ref<string | null>(null);

// Partner Status Bar State
const currentUserProfile = ref<any>(getUser());
const partnerProfile = ref<any>(null);
const householdName = ref("");

const detailOpened = ref(false);
const selectedTransaction = ref<Transaction | null>(null);

const showTransactionDetail = (txn: Transaction) => {
  selectedTransaction.value = txn;
  detailOpened.value = true;
};

const loadDashboard = async () => {
  try {
    const periodList = await periods.list();
    const currentPeriod = periodList.find(p => !p.isClosed) || periodList[0];

    if (!currentPeriod) {
      loading.value = false;
      return;
    }

    currentPeriodId.value = currentPeriod.id;

    // Fetch details
    const [detail, txns, recDiff, householdRes] = await Promise.all([
      periods.getDetail(currentPeriod.id),
      txnApi.list({ periodId: currentPeriod.id, limit: 5 }),
      reconcile.diff().catch(() => null),
      household.get().catch(() => null),
    ]);

    // Update state
    summary.value = {
      remaining: parseFloat(detail.summary.totalRemaining),
      allocated: parseFloat(detail.summary.totalAllocated),
      spent: parseFloat(detail.summary.totalSpent),
    };
    allocationsData.value = detail.allocations;
    recentTxns.value = txns;
    reconcileData.value = recDiff;

    // Process household members and profiles
    if (householdRes) {
      const currentUserId = getUser()?.id;
      const members = householdRes.members || [];
      const me = members.find((m: any) => m.userId === currentUserId);
      const partner = members.find((m: any) => m.userId !== currentUserId);

      currentUserProfile.value = me || getUser();
      partnerProfile.value = partner || null;
      householdName.value = householdRes.household?.name || "";
    } else {
      currentUserProfile.value = getUser();
      partnerProfile.value = null;
      householdName.value = "";
    }
  } catch (err) {
    console.error("Gagal memuat data dasbor:", err);
  } finally {
    loading.value = false;
  }
};

const navigateToAddTransaction = () => {
  if (f7.views.main && f7.views.main.router) {
    f7.views.main.router.navigate("/add-transaction/");
  }
};

const openAddTransactionWithEnvelope = (allocationId: string) => {
  if (f7.views.main && f7.views.main.router) {
    f7.views.main.router.navigate(`/add-transaction/?allocationId=${allocationId}`);
  }
};

const deleteTxn = async (id: string) => {
  try {
    f7.dialog.preloader("Menghapus transaksi...");
    await txnApi.remove(id);
    f7.dialog.close();

    f7.toast
      .create({
        text: "Transaksi berhasil dihapus! 🗑️",
        closeTimeout: 2000,
        destroyOnClose: true,
      })
      .open();

    await loadDashboard();
  } catch (err: any) {
    f7.dialog.close();
    f7.dialog.alert("Gagal menghapus transaksi: " + err.message, "Oops");
  }
};

const handleTransactionSaved = async (e: Event) => {
  const detail = (e as CustomEvent).detail;
  if (!detail) {
    // SSE update from partner, reload dashboard data
    await loadDashboard();
    return;
  }

  // Only run if this page's view is currently the active view
  if (f7.views.current?.router?.currentRoute?.path !== "/") return;

  const { ids, amount, merchant, isSplit } = detail;
  const merchantText = merchant ? ` di ${merchant}` : "";
  const typeText = isSplit ? "Pecahan transaksi" : "Transaksi";

  const toast = f7.toast.create({
    text: `✅ ${typeText} Rp ${formatRp(amount)}${merchantText} disimpan!`,
    closeButton: true,
    closeButtonText: "Batal (Undo)",
    closeButtonColor: "yellow",
    closeTimeout: 6000,
    destroyOnClose: true,
    on: {
      closeButtonClick: async () => {
        try {
          f7.dialog.preloader("Membatalkan transaksi...");
          await Promise.all(ids.map((id: string) => txnApi.remove(id)));
          f7.dialog.close();

          f7.toast
            .create({
              text: "🔄 Transaksi berhasil dibatalkan!",
              closeTimeout: 2000,
              destroyOnClose: true,
            })
            .open();

          await loadDashboard();
        } catch (err: any) {
          f7.dialog.close();
          f7.dialog.alert("Gagal membatalkan transaksi: " + err.message, "Oops");
        }
      },
    },
  });
  toast.open();
};

onMounted(async () => {
  window.addEventListener("fintr:transaction-saved", handleTransactionSaved);
  window.addEventListener("fintr:envelope-changed", loadDashboard);

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
  window.removeEventListener("fintr:envelope-changed", loadDashboard);
});
</script>
