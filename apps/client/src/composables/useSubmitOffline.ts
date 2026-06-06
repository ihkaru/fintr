import { f7 } from "framework7-vue";
import { queueTransaction, queueSplitTransaction } from "../js/utils/offlineQueue";

export function useSubmitOffline() {
  const handleOfflineSave = (
    form: {
      amount: number | "";
      merchant: string;
      note: string;
      date: string;
      source: "manual" | "ocr";
      allocationId: string;
      rawImageKey: string;
    },
    targetPeriodId: string,
    routerBackCallback: () => void
  ) => {
    const txPayload = {
      periodId: targetPeriodId,
      allocationId: form.allocationId,
      amount: Number(form.amount),
      merchant: form.merchant || undefined,
      note: form.note || undefined,
      transactionAt: new Date(form.date).toISOString(),
      source: form.source,
      rawImageKey: form.rawImageKey || undefined,
    };

    queueTransaction(txPayload);
    f7.toast
      .create({
        text: "Koneksi terputus. Transaksi Anda disimpan secara offline dan akan disinkronkan saat koneksi kembali.",
        closeTimeout: 4000,
        position: "bottom",
      })
      .open();

    window.dispatchEvent(
      new CustomEvent("fintr:transaction-saved", {
        detail: {
          ids: ["offline_" + Date.now()],
          amount: Number(form.amount),
          merchant: form.merchant || undefined,
          isSplit: false,
        },
      })
    );
    routerBackCallback();
  };

  const handleOfflineSplitSave = (
    txns: any[],
    splitTotal: number,
    merchant: string | undefined,
    routerBackCallback: () => void
  ) => {
    queueSplitTransaction({ transactions: txns });
    f7.toast
      .create({
        text: "Koneksi terputus. Transaksi Anda disimpan secara offline dan akan disinkronkan saat koneksi kembali.",
        closeTimeout: 4000,
        position: "bottom",
      })
      .open();

    window.dispatchEvent(
      new CustomEvent("fintr:transaction-saved", {
        detail: {
          ids: ["offline_split_" + Date.now()],
          amount: splitTotal,
          merchant: merchant || undefined,
          isSplit: true,
        },
      })
    );
    routerBackCallback();
  };

  return {
    handleOfflineSave,
    handleOfflineSplitSave,
  };
}
