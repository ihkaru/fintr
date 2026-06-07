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
      <div
        v-if="txns.length === 0"
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
          Riwayat Transaksi Kosong
        </div>
        <div style="font-size: 12px; color: #707973; margin-bottom: 20px; line-height: 1.6">
          Belum ada catatan pengeluaran di rumah tangga Anda. Catat pengeluaran Anda untuk memantau
          sisa limit anggaran bulanan.
        </div>
        <f7-link
          href="/add-transaction/"
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
          ✍️ Catat Transaksi Pertama
        </f7-link>
      </div>

      <div v-else>
        <!-- Search & Filter Controls -->
        <div style="padding: 16px 16px 8px; background: transparent">
          <!-- Search Input -->
          <div style="position: relative; margin-bottom: 12px">
            <span
              class="material-symbols-outlined"
              style="
                position: absolute;
                left: 14px;
                top: 50%;
                transform: translateY(-50%);
                color: #707973;
                font-size: 20px;
              "
            >
              search
            </span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari toko, barang, nominal..."
              style="
                width: 100%;
                padding: 12px 40px 12px 44px;
                background: #ffffff;
                border: 1px solid #bfc9c1;
                border-radius: 16px;
                font-size: 14px;
                color: #161a32;
                box-sizing: border-box;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.01);
                outline: none;
                transition: border-color 0.2s;
              "
              onfocus="this.style.borderColor = '#0f5238'"
              onblur="this.style.borderColor = '#bfc9c1'"
            />
            <!-- Clear Button -->
            <span
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="material-symbols-outlined"
              style="
                position: absolute;
                right: 14px;
                top: 50%;
                transform: translateY(-50%);
                color: #707973;
                font-size: 20px;
                cursor: pointer;
              "
            >
              close
            </span>
          </div>

          <!-- Filter Chips Row 1: Envelopes -->
          <div style="margin-bottom: 12px" v-if="uniqueEnvelopes.length > 0">
            <div
              style="
                font-size: 11px;
                font-weight: 700;
                color: #707973;
                margin-bottom: 6px;
                padding-left: 4px;
              "
            >
              FILTER AMPLOP
            </div>
            <div
              class="scroll-x-no-scrollbar"
              style="
                display: flex;
                gap: 8px;
                overflow-x: auto;
                padding-bottom: 4px;
                -webkit-overflow-scrolling: touch;
              "
            >
              <div
                @click="selectedEnvelope = null"
                :style="getChipStyle(selectedEnvelope === null)"
              >
                Semua Amplop
              </div>
              <div
                v-for="env in uniqueEnvelopes"
                :key="env"
                @click="selectedEnvelope = env"
                :style="getChipStyle(selectedEnvelope === env)"
              >
                {{ env }}
              </div>
            </div>
          </div>

          <!-- Filter Chips Row 2: Sources -->
          <div style="margin-bottom: 4px">
            <div
              style="
                font-size: 11px;
                font-weight: 700;
                color: #707973;
                margin-bottom: 6px;
                padding-left: 4px;
              "
            >
              FILTER SUMBER
            </div>
            <div
              class="scroll-x-no-scrollbar"
              style="
                display: flex;
                gap: 8px;
                overflow-x: auto;
                padding-bottom: 4px;
                -webkit-overflow-scrolling: touch;
              "
            >
              <div
                v-for="src in sources"
                :key="src.id"
                @click="selectedSource = src.id"
                :style="getChipStyle(selectedSource === src.id)"
              >
                {{ src.name }}
              </div>
            </div>
          </div>
        </div>

        <!-- Active Filters Status Bar -->
        <div
          v-if="isAnyFilterActive"
          style="
            margin: 4px 16px 12px;
            padding: 10px 14px;
            background: #eef5f0;
            border: 1px solid rgba(15, 82, 56, 0.15);
            border-radius: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            color: #0f5238;
            font-weight: 600;
          "
        >
          <span>Menampilkan {{ filteredTxns.length }} dari {{ txns.length }} transaksi</span>
          <f7-link @click="resetFilters" style="font-size: 12px; font-weight: 700; color: #ba1a1a">
            Reset Filter
          </f7-link>
        </div>

        <!-- Filter Empty State -->
        <div
          v-if="filteredTxns.length === 0"
          style="
            margin: 16px;
            background: white;
            border: 1px dashed #bfc9c1;
            border-radius: 16px;
            padding: 32px;
            text-align: center;
          "
        >
          <div style="font-size: 48px; margin-bottom: 16px">🔍</div>
          <div style="font-size: 15px; font-weight: 700; color: #161a32; margin-bottom: 8px">
            Tidak Ada Transaksi yang Cocok
          </div>
          <div style="font-size: 12px; color: #707973; margin-bottom: 16px; line-height: 1.6">
            Coba ganti kata kunci pencarian Anda atau reset filter aktif untuk melihat transaksi
            lainnya.
          </div>
          <f7-link
            @click="resetFilters"
            style="
              display: inline-block;
              font-size: 13px;
              font-weight: 700;
              color: white;
              background: #0f5238;
              padding: 10px 24px;
              border-radius: 12px;
            "
          >
            Reset Filter & Pencarian
          </f7-link>
        </div>

        <!-- Transaction List Grouped by Date -->
        <div
          v-else
          v-for="group in groupedTransactions"
          :key="group.date"
          class="transactions-date-group"
          style="margin-bottom: 16px"
        >
          <!-- Date Header -->
          <div
            style="
              font-size: 12px;
              font-weight: 700;
              color: #707973;
              margin: 16px 20px 8px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            "
          >
            {{ group.date }}
          </div>

          <f7-list
            media-list
            class="no-margin no-hairlines transactions-list-group"
            style="background: transparent"
          >
            <f7-list-item
              v-for="txn in group.transactions"
              :key="txn.id"
              :title="txn.note || txn.merchant || 'Belanja'"
              :subtitle="txn.envelopeName"
              :text="
                txn.note && txn.merchant
                  ? `${txn.merchant} · ${formatTxnTime(txn.transactionAt)}`
                  : formatTxnTime(txn.transactionAt)
              "
              :after="`-${formatRp(parseFloat(txn.amount))}`"
              swipeout
              @click="showTransactionDetail(txn)"
              @swipeout:delete="deleteTxn(txn.id)"
              style="cursor: pointer"
            >
              <template #media>
                <div
                  class="icon-circle"
                  :style="{
                    position: 'relative',
                    background: `${txn.envelopeColor}16`,
                    color: txn.envelopeColor,
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                  }"
                >
                  {{ getEnvelopeEmoji(txn.envelopeName) }}
                  <!-- Source Overlay Badge -->
                  <div
                    v-if="txn.source === 'ocr' || txn.source === 'share'"
                    style="
                      position: absolute;
                      bottom: -3px;
                      right: -3px;
                      background: white;
                      border: 1.5px solid #ffffff;
                      border-radius: 50%;
                      width: 14px;
                      height: 14px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      font-size: 8px;
                      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
                    "
                  >
                    {{ txn.source === "ocr" ? "📷" : "📱" }}
                  </div>
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
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
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
import { getEnvelopeEmoji } from "../js/utils/emoji";
import TransactionDetailSheet from "../components/TransactionDetailSheet.vue";

const loading = ref(true);
const txns = ref<Transaction[]>([]);

// Filter states
const searchQuery = ref("");
const selectedEnvelope = ref<string | null>(null);
const selectedSource = ref<string>("");

const detailOpened = ref(false);
const selectedTransaction = ref<Transaction | null>(null);

const showTransactionDetail = (txn: Transaction) => {
  selectedTransaction.value = txn;
  detailOpened.value = true;
};

// Sources data
const sources = [
  { id: "", name: "Semua Sumber" },
  { id: "ocr", name: "📷 Struk" },
  { id: "share", name: "📱 Share" },
  { id: "manual", name: "✍️ Manual" },
];

// Helper styles for chips
const getChipStyle = (isActive: boolean) => {
  return {
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    transition: "all 0.2s",
    background: isActive ? "#0f5238" : "#ffffff",
    color: isActive ? "#ffffff" : "#707973",
    border: isActive ? "1px solid #0f5238" : "1px solid #bfc9c1",
    boxShadow: isActive ? "0 2px 6px rgba(15, 82, 56, 0.12)" : "none",
  };
};

// Reset filters
const resetFilters = () => {
  searchQuery.value = "";
  selectedEnvelope.value = null;
  selectedSource.value = "";
};

// Check if any filter is active
const isAnyFilterActive = computed(() => {
  return !!searchQuery.value || selectedEnvelope.value !== null || selectedSource.value !== "";
});

// Extract unique envelopes from loaded transactions
const uniqueEnvelopes = computed(() => {
  const names = txns.value.map(t => t.envelopeName);
  return Array.from(new Set(names)).filter(Boolean);
});

// Filter transactions dynamically
const filteredTxns = computed(() => {
  return txns.value.filter(txn => {
    // 1. Search Query
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      const matchMerchant = txn.merchant?.toLowerCase().includes(q);
      const matchNote = txn.note?.toLowerCase().includes(q);
      const matchEnvelope = txn.envelopeName.toLowerCase().includes(q);
      const matchAmount = txn.amount.toString().includes(q);
      if (!matchMerchant && !matchNote && !matchEnvelope && !matchAmount) {
        return false;
      }
    }
    // 2. Envelope Filter
    if (selectedEnvelope.value && txn.envelopeName !== selectedEnvelope.value) {
      return false;
    }
    // 3. Source Filter
    if (selectedSource.value && txn.source !== selectedSource.value) {
      return false;
    }
    return true;
  });
});

// Group transactions by date
const groupedTransactions = computed(() => {
  const groups: { [key: string]: Transaction[] } = {};

  // Sort transactions in descending order first
  const sorted = [...filteredTxns.value].sort(
    (a, b) => new Date(b.transactionAt).getTime() - new Date(a.transactionAt).getTime()
  );

  sorted.forEach(txn => {
    const date = new Date(txn.transactionAt);
    const dateKey = date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(txn);
  });

  return Object.keys(groups).map(date => ({
    date,
    transactions: groups[date],
  }));
});

// Format transaction time
const formatTxnTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const exportToCSV = () => {
  if (filteredTxns.value.length === 0) {
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

  const rows = filteredTxns.value.map(t => {
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
      text: `${filteredTxns.value.length} transaksi berhasil diekspor! 📁`,
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
  await loadTransactions();

  const detail = (e as CustomEvent).detail;
  if (!detail) return;

  const isCurrentView = f7.views.current?.router?.currentRoute?.path === "/transactions/";
  if (!isCurrentView) return;

  const { ids, amount, merchant, isSplit } = detail;
  const merchantText = merchant ? ` di ${merchant}` : "";
  const typeText = isSplit ? "Pecahan transaksi" : "Transaksi";

  const toast = f7.toast.create({
    text: `✅ ${typeText} ${formatRp(amount)}${merchantText} disimpan!`,
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
  window.addEventListener("fintr:envelope-changed", loadTransactions);
});

onBeforeUnmount(() => {
  window.removeEventListener("fintr:transaction-saved", handleTransactionSaved);
  window.removeEventListener("fintr:envelope-changed", loadTransactions);
});
</script>

<style scoped>
.scroll-x-no-scrollbar::-webkit-scrollbar {
  display: none;
}
.scroll-x-no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

:deep(.transactions-list-group ul) {
  background: transparent !important;
}

:deep(.transactions-list-group .swipeout) {
  background: white;
  border: 1px solid #bfc9c1;
  border-radius: 16px;
  margin-bottom: 8px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.01);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

:deep(.transactions-list-group .swipeout:active) {
  transform: scale(0.99);
}

:deep(.transactions-list-group .item-content) {
  padding-left: 12px;
}

:deep(.transactions-list-group .item-inner) {
  padding-right: 16px;
  padding-top: 12px;
  padding-bottom: 12px;
}

:deep(.transactions-list-group .item-title) {
  font-weight: 700;
  color: #161a32;
  font-size: 14px;
}

:deep(.transactions-list-group .item-subtitle) {
  font-size: 11px;
  color: #0f5238;
  font-weight: 700;
  margin-top: 2px;
}

:deep(.transactions-list-group .item-text) {
  font-size: 11px;
  color: #707973;
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 4px;
}

:deep(.transactions-list-group .item-after) {
  font-family: var(--fintr-font-headline);
  font-weight: 800;
  color: #ba1a1a;
  font-size: 14px;
}
</style>
