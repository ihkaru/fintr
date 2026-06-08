import { ref, Ref } from "vue";
import { transactions } from "../js/api";
import { f7 } from "framework7-vue";
import { formatRp } from "../js/routes";

// Decomposed Child Composables
import { useSubmitOffline } from "./useSubmitOffline";
import { useSubmitValidation } from "./useSubmitValidation";
import { useSubmitOverBudget } from "./useSubmitOverBudget";
import { useSubmitTemporalLock } from "./useSubmitTemporalLock";

export function useTransactionSubmit(
  form: {
    amount: number | "";
    merchant: string;
    note: string;
    date: string;
    source: "manual" | "ocr";
    allocationId: string;
    rawImageKey: string;
  },
  currentPeriodId: Ref<string>,
  isSplit: Ref<boolean>,
  splitRemaining: Ref<number>,
  splitItems: Ref<Array<{ allocationId: string; amount: number | ""; note?: string }>>,
  splitTotal: Ref<number>,
  allocations: Ref<Array<any>>,
  filterSufficientOnly?: Ref<boolean>
) {
  const submitting = ref(false);

  const { handleOfflineSave, handleOfflineSplitSave } = useSubmitOffline();
  const { validateForm } = useSubmitValidation();
  const { checkOverBudget } = useSubmitOverBudget();
  const { checkTemporalLock } = useSubmitTemporalLock();

  const executeSaveTransaction = async (
    alertCallback: (msg: string, title: string) => void,
    routerBackCallback: () => void,
    opts?: { forceWriteClosedPeriod?: boolean; targetPeriodId?: string; allowDuplicate?: boolean }
  ) => {
    submitting.value = true;
    const targetPeriod = opts?.targetPeriodId || currentPeriodId.value;

    if (!navigator.onLine) {
      handleOfflineSave(form, targetPeriod, routerBackCallback);
      submitting.value = false;
      return;
    }

    const txPayload = {
      periodId: targetPeriod,
      allocationId: form.allocationId,
      amount: Number(form.amount),
      merchant: form.merchant || undefined,
      note: form.note || undefined,
      transactionAt: new Date(form.date).toISOString(),
      source: form.source,
      rawImageKey: form.rawImageKey || undefined,
      forceWriteClosedPeriod: opts?.forceWriteClosedPeriod || undefined,
      allowDuplicate: opts?.allowDuplicate || undefined,
    };

    try {
      const res = (await transactions.create(txPayload)) as any;

      window.dispatchEvent(
        new CustomEvent("fintr:transaction-saved", {
          detail: {
            ids: [res.id],
            amount: Number(form.amount),
            merchant: form.merchant || undefined,
            isSplit: false,
            allocationId: form.allocationId,
          },
        })
      );

      routerBackCallback();
    } catch (err: any) {
      const isNetworkError =
        err instanceof TypeError ||
        err.message?.toLowerCase().includes("failed to fetch") ||
        err.message?.toLowerCase().includes("network error") ||
        err.message?.toLowerCase().includes("load failed");

      if (isNetworkError) {
        handleOfflineSave(form, targetPeriod, routerBackCallback);
      } else if (
        err.status === 409 &&
        err.responseJson?.error === "DUPLICATE_TRANSACTION_DETECTED"
      ) {
        const dup = err.responseJson.duplicate;
        f7.dialog.confirm(
          `Pengeluaran sebesar <strong>${formatRp(dup.amount)}</strong> di <strong>"${dup.merchant || "Merchant"}"</strong> telah dicatat oleh <strong>${dup.createdBy || "pasangan Anda"}</strong> pada <strong>${new Date(dup.transactionAt).toLocaleString("id-ID")}</strong>.<br><br>Apakah ini transaksi yang berbeda?`,
          "Transaksi Ganda Terdeteksi",
          () => {
            executeSaveTransaction(alertCallback, routerBackCallback, {
              ...opts,
              allowDuplicate: true,
            });
          }
        );
      } else {
        alertCallback("Gagal menyimpan: " + err.message, "Error");
      }
    } finally {
      submitting.value = false;
    }
  };

  const executeSaveSplitTransaction = async (
    alertCallback: (msg: string, title: string) => void,
    routerBackCallback: () => void,
    opts?: { forceWriteClosedPeriod?: boolean; targetPeriodId?: string; allowDuplicate?: boolean }
  ) => {
    submitting.value = true;
    const txns = splitItems.value.map(item => ({
      periodId: opts?.targetPeriodId || currentPeriodId.value,
      allocationId: item.allocationId,
      amount: Number(item.amount),
      merchant: form.merchant || undefined,
      note: item.note
        ? item.note
        : form.note
          ? `${form.note} (${splitItems.value.indexOf(item) + 1}/${splitItems.value.length})`
          : `Split (${splitItems.value.indexOf(item) + 1}/${splitItems.value.length})`,
      transactionAt: new Date(form.date).toISOString(),
      source: form.source,
      rawImageKey: form.rawImageKey || undefined,
    }));

    if (!navigator.onLine) {
      handleOfflineSplitSave(txns, splitTotal.value, form.merchant, routerBackCallback);
      submitting.value = false;
      return;
    }

    try {
      const res = (await transactions.createSplit({
        transactions: txns,
        forceWriteClosedPeriod: opts?.forceWriteClosedPeriod || undefined,
        allowDuplicate: opts?.allowDuplicate || undefined,
      })) as any;
      const createdIds = res.map((t: any) => t.id);

      window.dispatchEvent(
        new CustomEvent("fintr:transaction-saved", {
          detail: {
            ids: createdIds,
            amount: splitTotal.value,
            merchant: form.merchant || undefined,
            isSplit: true,
            allocationIds: txns.map(t => t.allocationId),
          },
        })
      );

      routerBackCallback();
    } catch (err: any) {
      const isNetworkError =
        err instanceof TypeError ||
        err.message?.toLowerCase().includes("failed to fetch") ||
        err.message?.toLowerCase().includes("network error") ||
        err.message?.toLowerCase().includes("load failed");

      if (isNetworkError) {
        handleOfflineSplitSave(txns, splitTotal.value, form.merchant, routerBackCallback);
      } else if (
        err.status === 409 &&
        err.responseJson?.error === "DUPLICATE_TRANSACTION_DETECTED"
      ) {
        const dup = err.responseJson.duplicate;
        f7.dialog.confirm(
          `Pengeluaran sebesar <strong>${formatRp(dup.amount)}</strong> di <strong>"${dup.merchant || "Merchant"}"</strong> telah dicatat oleh <strong>${dup.createdBy || "pasangan Anda"}</strong> pada <strong>${new Date(dup.transactionAt).toLocaleString("id-ID")}</strong>.<br><br>Apakah ini transaksi yang berbeda?`,
          "Transaksi Ganda Terdeteksi",
          () => {
            executeSaveSplitTransaction(alertCallback, routerBackCallback, {
              ...opts,
              allowDuplicate: true,
            });
          }
        );
      } else {
        alertCallback("Gagal menyimpan split transaksi: " + err.message, "Error");
      }
    } finally {
      submitting.value = false;
    }
  };

  const saveTransaction = async (
    alertCallback: (msg: string, title: string) => void,
    routerBackCallback: () => void
  ) => {
    // 1. Validation
    if (!validateForm(form, isSplit.value, splitRemaining.value, splitItems.value, alertCallback)) {
      return;
    }

    // Helper functions passed into checkTemporalLock / checkOverBudget
    const continueNormalSaveFlow = (opts?: {
      forceWriteClosedPeriod?: boolean;
      targetPeriodId?: string;
    }) => {
      if (isSplit.value) {
        executeSaveSplitTransaction(alertCallback, routerBackCallback, opts);
      } else {
        const handledOverBudget = checkOverBudget(
          form,
          allocations,
          filterSufficientOnly,
          async overBudgetOpts => {
            await executeSaveTransaction(alertCallback, routerBackCallback, overBudgetOpts);
          },
          alertCallback,
          opts
        );
        if (!handledOverBudget) {
          executeSaveTransaction(alertCallback, routerBackCallback, opts);
        }
      }
    };

    // 2. Temporal Lock Check
    const cancelCallback = () => {
      submitting.value = false;
    };

    const isLocked = await checkTemporalLock(
      form,
      alertCallback,
      continueNormalSaveFlow,
      cancelCallback
    );
    if (isLocked) {
      return; // Wait for user action in dialog
    }

    continueNormalSaveFlow();
  };

  return {
    submitting,
    saveTransaction,
  };
}
