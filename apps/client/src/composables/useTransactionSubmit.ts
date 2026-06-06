import { ref, Ref } from "vue";
import { transactions, periods } from "../js/api";
import { f7 } from "framework7-vue";
import { formatRp } from "../js/routes";
import { allocations as allocationsApi } from "../js/api/allocations";
import { queueTransaction, queueSplitTransaction } from "../js/utils/offlineQueue";

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
  splitTotal: Ref<number>,
  allocations: Ref<Array<any>>,
  filterSufficientOnly?: Ref<boolean>
) {
  const submitting = ref(false);

  const executeSaveTransaction = async (
    alertCallback: (msg: string, title: string) => void,
    routerBackCallback: () => void,
    opts?: { forceWriteClosedPeriod?: boolean; targetPeriodId?: string; allowDuplicate?: boolean }
  ) => {
    submitting.value = true;
    const txPayload = {
      periodId: opts?.targetPeriodId || currentPeriodId.value,
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

    if (!navigator.onLine) {
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
      submitting.value = false;
      return;
    }

    try {
      const res = (await transactions.create(txPayload)) as any;

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
      const isNetworkError =
        err instanceof TypeError ||
        err.message?.toLowerCase().includes("failed to fetch") ||
        err.message?.toLowerCase().includes("network error") ||
        err.message?.toLowerCase().includes("load failed");

      if (isNetworkError) {
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
      note: form.note
        ? `${form.note} (${splitItems.value.indexOf(item) + 1}/${splitItems.value.length})`
        : `Split (${splitItems.value.indexOf(item) + 1}/${splitItems.value.length})`,
      transactionAt: new Date(form.date).toISOString(),
      source: form.source,
      rawImageKey: form.rawImageKey || undefined,
    }));

    if (!navigator.onLine) {
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
            amount: splitTotal.value,
            merchant: form.merchant || undefined,
            isSplit: true,
          },
        })
      );
      routerBackCallback();
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
              amount: splitTotal.value,
              merchant: form.merchant || undefined,
              isSplit: true,
            },
          })
        );
        routerBackCallback();
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
    } else {
      if (!form.allocationId) {
        alertCallback("Pilih amplop alokasi pengeluaran", "Oops");
        return;
      }
    }

    // Temporal lock check (Opsi A vs Opsi B)
    try {
      if (navigator.onLine) {
        const periodList = await periods.list();
        const txDate = new Date(form.date);
        const txYear = txDate.getFullYear();
        const txMonth = txDate.getMonth() + 1;
        const txPeriod = periodList.find(p => p.year === txYear && p.month === txMonth);

        if (txPeriod && txPeriod.isClosed) {
          const activePeriod = periodList.find(p => !p.isClosed);
          if (!activePeriod) {
            alertCallback("Tidak ada periode anggaran aktif. Buka periode dulu.", "Oops");
            return;
          }

          const monthDiff =
            (activePeriod.year - txPeriod.year) * 12 + (activePeriod.month - txPeriod.month);

          const proceedWithDecision = (chosenOpsi: "A" | "B") => {
            if (chosenOpsi === "A") {
              const pad = (num: number) => String(num).padStart(2, "0");
              const originalDateOnly = form.date.slice(0, 10);
              form.date = `${activePeriod.year}-${pad(activePeriod.month)}-01T00:00`;
              const noteSuffix = `(Struk Asli: ${originalDateOnly})`;
              form.note = form.note ? `${form.note} ${noteSuffix}` : noteSuffix;
              continueNormalSaveFlow();
            } else {
              continueNormalSaveFlow({
                forceWriteClosedPeriod: true,
                targetPeriodId: txPeriod.id,
              });
            }
          };

          const buttons: Array<{ text: string; color?: string; onClick?: () => void }> = [];

          buttons.push({
            text: "Catat di Periode Berjalan (Rekomendasi)",
            onClick: () => proceedWithDecision("A"),
          });

          if (monthDiff === 1) {
            buttons.push({
              text: "Buka Sementara & Rekalkulasi",
              onClick: () => proceedWithDecision("B"),
            });
          }

          buttons.push({
            text: "Batal",
            color: "red",
          });

          const title = "📅 Transaksi di Periode Tertutup";
          let message = `Transaksi ini bertanggal <strong>${new Date(form.date).toLocaleDateString("id-ID")}</strong>, yang berada pada periode anggaran yang sudah ditutup.<br><br>Pilih tindakan untuk melanjutkan:`;
          if (monthDiff > 1) {
            message += `<br><br><span style="color: #d9383a; font-size: 11px; font-weight: 600;">⚠️ Opsi Buka Sementara dinonaktifkan karena periode tertutup lebih dari 1 bulan yang lalu.</span>`;
          }

          f7.dialog
            .create({
              title,
              text: message,
              verticalButtons: true,
              buttons,
            })
            .open();

          return; // Wait for user choice
        }
      }
    } catch (e: any) {
      console.error("Gagal memeriksa periode:", e);
    }

    continueNormalSaveFlow();

    function continueNormalSaveFlow(opts?: {
      forceWriteClosedPeriod?: boolean;
      targetPeriodId?: string;
    }) {
      if (isSplit.value) {
        executeSaveSplitTransaction(alertCallback, routerBackCallback, opts);
      } else {
        const selectedAlloc = allocations.value.find(a => a.id === form.allocationId);
        if (selectedAlloc && form.source === "ocr" && !opts?.forceWriteClosedPeriod) {
          const remaining = Number(selectedAlloc.remaining);
          const amount = Number(form.amount);
          if (amount > remaining) {
            const dialog = f7.dialog.create({
              title: "💳 Transaksi Over-Budget",
              text: `Amplop "<strong>${selectedAlloc.envelopeName}</strong>" memiliki sisa saldo sebesar <strong>${formatRp(remaining)}</strong>.<br><br>Karena transaksi ini sudah terlanjur dibayar, pilih cara pencatatannya:`,
              verticalButtons: true,
              buttons: [
                {
                  text: `Catat & Biarkan Minus (Sisa: ${formatRp(remaining - amount)})`,
                  onClick: () => {
                    executeSaveTransaction(alertCallback, routerBackCallback, opts);
                  },
                },
                {
                  text: "Gunakan Saldo Amplop Lain",
                  onClick: () => {
                    if (filterSufficientOnly) {
                      filterSufficientOnly.value = true;
                    }
                    f7.toast
                      .create({
                        text: "Menampilkan kategori amplop dengan saldo cukup. Silakan pilih kategori baru.",
                        closeTimeout: 4000,
                        position: "bottom",
                      })
                      .open();
                  },
                },
                {
                  text: `Naikkan Anggaran Sekarang (+${formatRp(amount - remaining)})`,
                  onClick: () => {
                    const deficiency = amount - remaining;
                    const oldAllocated = Number(selectedAlloc.allocatedAmount);
                    const newAllocated = oldAllocated + deficiency;

                    f7.dialog.confirm(
                      `Anggaran untuk "${selectedAlloc.envelopeName}" akan dinaikkan dari <strong>${formatRp(oldAllocated)}</strong> menjadi <strong>${formatRp(newAllocated)}</strong> agar transaksi ini bisa dicatat.<br><br>Setelah transaksi ini dicatat, sisa saldo amplop adalah <strong>${formatRp(0)}</strong>.<br><br>Apakah Anda setuju?`,
                      "Konfirmasi Kenaikan Anggaran",
                      async () => {
                        f7.dialog.preloader("Menyesuaikan anggaran...");
                        try {
                          if (!navigator.onLine) {
                            throw new TypeError("Failed to fetch");
                          }
                          await allocationsApi.update(selectedAlloc.id, newAllocated);

                          selectedAlloc.allocatedAmount = String(newAllocated);
                          selectedAlloc.remaining = "0";

                          window.dispatchEvent(new CustomEvent("fintr:envelope-changed"));

                          f7.dialog.close();

                          executeSaveTransaction(alertCallback, routerBackCallback, opts);
                        } catch (e: any) {
                          f7.dialog.close();

                          const isNetworkError =
                            e instanceof TypeError ||
                            e.message?.toLowerCase().includes("failed to fetch") ||
                            e.message?.toLowerCase().includes("network error") ||
                            e.message?.toLowerCase().includes("load failed");

                          if (isNetworkError) {
                            f7.toast
                              .create({
                                text: "Koneksi terputus. Gagal menaikkan anggaran di server. Transaksi akan disimpan offline & saldo dibiarkan minus sementara.",
                                closeTimeout: 5000,
                                position: "bottom",
                              })
                              .open();

                            executeSaveTransaction(alertCallback, routerBackCallback, opts);
                          } else {
                            alertCallback("Gagal menyesuaikan anggaran: " + e.message, "Error");
                          }
                        }
                      }
                    );
                  },
                },
                {
                  text: "Batal Catat",
                  color: "red",
                },
              ],
            });
            dialog.open();
            return;
          }
        }

        executeSaveTransaction(alertCallback, routerBackCallback, opts);
      }
    }
  };

  return {
    submitting,
    saveTransaction,
  };
}
