import { ref } from "vue";
import { f7 } from "framework7-vue";
import {
  getFailedQueue,
  removeFailedItem,
  clearFailedQueue,
  retryFailedItem,
} from "../js/utils/offlineQueue";
import type { OfflineTransaction } from "../js/utils/offlineQueue";

export function useFailedQueue() {
  const failedQueue = ref<OfflineTransaction[]>([]);
  const failedSheetOpened = ref(false);

  const loadFailedQueue = () => {
    failedQueue.value = getFailedQueue();
  };

  const onRemoveFailed = (id: string) => {
    removeFailedItem(id);
    loadFailedQueue();
    if (failedQueue.value.length === 0) {
      failedSheetOpened.value = false;
    }
  };

  const onRetryFailed = (id: string) => {
    retryFailedItem(id);
    loadFailedQueue();
    if (failedQueue.value.length === 0) {
      failedSheetOpened.value = false;
    }
  };

  const onClearAllFailed = () => {
    f7.dialog.confirm(
      "Apakah Anda yakin ingin menghapus semua pengeluaran offline yang gagal?",
      "Konfirmasi Hapus Semua",
      () => {
        clearFailedQueue();
        loadFailedQueue();
        failedSheetOpened.value = false;
      }
    );
  };

  const getSplitTotal = (data: any) => {
    if (data && Array.isArray(data.transactions)) {
      return data.transactions.reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0);
    }
    return 0;
  };

  const friendlyError = (msg?: string) => {
    if (!msg) return "Terjadi kesalahan tidak diketahui.";
    if (msg.includes("PERIOD_CLOSED")) {
      return "Periode anggaran bulan tersebut sudah ditutup.";
    }
    if (msg.includes("Kategori amplop asal tidak ditemukan") || msg.includes("tidak aktif")) {
      return "Kategori amplop yang dipilih sudah dihapus atau tidak aktif.";
    }
    if (msg.includes("OVER_BUDGET")) {
      return "Saldo amplop tidak mencukupi untuk nominal pengeluaran ini.";
    }
    return msg;
  };

  return {
    failedQueue,
    failedSheetOpened,
    loadFailedQueue,
    onRemoveFailed,
    onRetryFailed,
    onClearAllFailed,
    getSplitTotal,
    friendlyError,
  };
}
