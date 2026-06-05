<template>
  <f7-page name="transactions" @page:beforein="loadTransactions" @page:tabshow="loadTransactions">
    <f7-navbar title="Riwayat Transaksi">
      <f7-nav-right>
        <f7-link
          @click="exportToCSV"
          style="
            font-size: 14px;
            font-weight: 700;
            color: #0f5238;
            display: flex;
            align-items: center;
            gap: 4px;
            padding-right: 12px;
          "
        >
          📥 CSV
        </f7-link>
      </f7-nav-right>
    </f7-navbar>

    <div v-if="loading" style="text-align: center; padding: 48px">
      <f7-preloader size="42"></f7-preloader>
      <div style="margin-top: 16px; color: var(--fintr-text-muted)">Memuat daftar transaksi...</div>
    </div>

    <div v-else>
      <div v-if="txns.length === 0" class="empty-state">
        <div class="icon">📝</div>
        <div class="message">Belum ada transaksi tercatat.</div>
      </div>

      <div v-else>
        <!-- Transaction List Grouped by Date -->
        <f7-list media-list class="no-margin" style="background: transparent">
          <f7-list-item
            v-for="txn in txns"
            :key="txn.id"
            :title="txn.merchant || 'Transaksi'"
            :after="`-${formatRp(txn.amount)}`"
            :subtitle="txn.envelopeName"
            :text="txn.note || formatTxnDate(txn.transactionAt)"
            swipeout
            @click="showTransactionDetail(txn)"
            @swipeout:delete="deleteTxn(txn.id)"
            style="cursor: pointer"
          >
            <template #media>
              <div
                class="icon-circle"
                :style="{
                  background: `${txn.envelopeColor}22`,
                  color: txn.envelopeColor,
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                }"
              >
                {{ txn.source === "ocr" ? "📷" : txn.source === "share" ? "📱" : "✍️" }}
              </div>
            </template>
            <f7-swipeout-actions right>
              <f7-swipeout-button delete confirm-text="Hapus transaksi ini?">
                Hapus
              </f7-swipeout-button>
            </f7-swipeout-actions>
          </f7-list-item>
        </f7-list>
      </div>
    </div>

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
  f7NavRight,
  f7Link,
  f7Preloader,
  f7List,
  f7ListItem,
  f7SwipeoutActions,
  f7SwipeoutButton,
  f7,
} from "framework7-vue";
import { transactions, Transaction } from "../js/api";
import { formatRp } from "../js/routes";
import TransactionDetailSheet from "../components/TransactionDetailSheet.vue";

const loading = ref(true);
const txns = ref<Transaction[]>([]);

const detailOpened = ref(false);
const selectedTransaction = ref<Transaction | null>(null);

const showTransactionDetail = (txn: Transaction) => {
  selectedTransaction.value = txn;
  detailOpened.value = true;
};

const exportToCSV = () => {
  if (txns.value.length === 0) {
    f7.dialog.alert("Tidak ada transaksi untuk diekspor.", "Info");
    return;
  }

  const headers = [
    "Tanggal",
    "Nama Toko / Detail",
    "Amplop",
    "Jumlah (Rp)",
    "Metode / Sumber",
    "Catatan",
  ];

  const rows = txns.value.map(t => {
    const date = new Date(t.transactionAt).toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    return [
      date,
      t.merchant || "Transaksi Pengeluaran",
      t.envelopeName,
      t.amount,
      t.source === "ocr" ? "Scan Struk" : t.source === "share" ? "Shared PWA" : "Input Manual",
      t.note || "",
    ];
  });

  const csvContent =
    "\uFEFF" +
    [
      // Add UTF-8 BOM so Excel opens it correctly with accents/local characters
      headers.join(","),
      ...rows.map(row =>
        row
          .map(val => {
            const escaped = String(val).replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(",")
      ),
    ].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `fintr-famivault-${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  f7.toast
    .create({
      text: "CSV berhasil diunduh! 📁",
      closeTimeout: 2000,
      position: "bottom",
    })
    .open();
};

const loadTransactions = async () => {
  try {
    const list = await transactions.list();
    txns.value = list;
  } catch (err: any) {
    f7.dialog.alert("Gagal memuat transaksi: " + err.message);
  } finally {
    loading.value = false;
  }
};

const formatTxnDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const deleteTxn = async (id: string) => {
  try {
    f7.dialog.preloader("Menghapus transaksi...");
    await transactions.remove(id);
    f7.dialog.close();
    txns.value = txns.value.filter(t => t.id !== id);
    f7.toast
      .create({
        text: "Transaksi dihapus",
        closeTimeout: 2000,
      })
      .open();
  } catch (err: any) {
    f7.dialog.close();
    f7.dialog.alert("Gagal menghapus: " + err.message);
  }
};

const handleTransactionSaved = async (e: Event) => {
  // Always update transactions when saved/changed
  await loadTransactions();

  const detail = (e as CustomEvent).detail;
  if (!detail) return; // SSE update (no toast needed here, handled by page that was in foreground or just silent update)

  // Show Toast only if this page's view is currently the active view
  const isCurrentView = f7.views.current?.router?.currentRoute?.path === "/transactions/";
  if (!isCurrentView) return;

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
          await Promise.all(ids.map((id: string) => transactions.remove(id)));
          f7.dialog.close();

          f7.toast
            .create({
              text: "🔄 Transaksi berhasil dibatalkan!",
              closeTimeout: 2000,
              destroyOnClose: true,
            })
            .open();

          await loadTransactions();
        } catch (err: any) {
          f7.dialog.close();
          f7.dialog.alert("Gagal membatalkan transaksi: " + err.message, "Oops");
        }
      },
    },
  });
  toast.open();
};

onMounted(() => {
  window.addEventListener("fintr:transaction-saved", handleTransactionSaved);
});

onBeforeUnmount(() => {
  window.removeEventListener("fintr:transaction-saved", handleTransactionSaved);
});
</script>
