import { ref, Ref } from "vue";
import { transactions } from "../js/api";

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
  splitItems: Ref<Array<{ allocationId: string; amount: number | "" }>>,
  splitTotal: Ref<number>
) {
  const submitting = ref(false);

  const saveTransaction = async (
    alertCallback: (msg: string, title: string) => void,
    routerBackCallback: () => void
  ) => {
    if (!form.amount || form.amount <= 0) {
      alertCallback("Jumlah pengeluaran harus lebih besar dari 0", "Oops");
      return;
    }

    if (isSplit.value) {
      if (splitRemaining.value !== 0) {
        alertCallback(
          `Jumlah nominal pecahan tidak sama dengan total nominal transaksi (selisih: Rp ${splitRemaining.value}). Silakan sesuaikan pembagian Anda.`,
          "Nominal Tidak Pas"
        );
        return;
      }

      for (let i = 0; i < splitItems.value.length; i++) {
        const item = splitItems.value[i];
        if (!item.allocationId) {
          alertCallback(`Pilih amplop untuk Bagian #${i + 1}`, "Oops");
          return;
        }
        if (!item.amount || item.amount <= 0) {
          alertCallback(`Nominal Bagian #${i + 1} harus lebih besar dari 0`, "Oops");
          return;
        }
      }

      submitting.value = true;
      try {
        const txns = splitItems.value.map(item => ({
          periodId: currentPeriodId.value,
          allocationId: item.allocationId,
          amount: Number(item.amount),
          merchant: form.merchant || undefined,
          note: form.note
            ? `${form.note} (${splitItems.value.indexOf(item) + 1}/${splitItems.value.length})`
            : `Split (${splitItems.value.indexOf(item) + 1}/${splitItems.value.length})`,
          transactionAt: new Date(form.date).toISOString(),
          source: form.source,
          rawImageKey: form.rawImageKey || undefined,
        }));

        const res = (await transactions.createSplit({ transactions: txns })) as any;
        const createdIds = res.map((t: any) => t.id);

        window.dispatchEvent(
          new CustomEvent("fintr:transaction-saved", {
            detail: {
              ids: createdIds,
              amount: splitTotal.value,
              merchant: form.merchant || undefined,
              isSplit: true,
            },
          })
        );

        routerBackCallback();
      } catch (err: any) {
        alertCallback("Gagal menyimpan split transaksi: " + err.message, "Error");
      } finally {
        submitting.value = false;
      }
      return;
    }

    // Normal mode saving
    if (!form.allocationId) {
      alertCallback("Pilih amplop alokasi pengeluaran", "Oops");
      return;
    }

    submitting.value = true;
    try {
      const res = (await transactions.create({
        periodId: currentPeriodId.value,
        allocationId: form.allocationId,
        amount: Number(form.amount),
        merchant: form.merchant || undefined,
        note: form.note || undefined,
        transactionAt: new Date(form.date).toISOString(),
        source: form.source,
        rawImageKey: form.rawImageKey || undefined,
      })) as any;

      window.dispatchEvent(
        new CustomEvent("fintr:transaction-saved", {
          detail: {
            ids: [res.id],
            amount: Number(form.amount),
            merchant: form.merchant || undefined,
            isSplit: false,
          },
        })
      );

      routerBackCallback();
    } catch (err: any) {
      alertCallback("Gagal menyimpan: " + err.message, "Error");
    } finally {
      submitting.value = false;
    }
  };

  return {
    submitting,
    saveTransaction,
  };
}
