import { Ref } from "vue";
import { f7 } from "framework7-vue";
import { formatRp } from "../js/routes";
import { allocations as allocationsApi } from "../js/api/allocations";

export function useSubmitOverBudget() {
  const checkOverBudget = (
    form: { amount: number | ""; allocationId: string; source: "manual" | "ocr" },
    allocations: Ref<Array<any>>,
    filterSufficientOnly: Ref<boolean> | undefined,
    executeSaveTransaction: (opts?: any) => Promise<void>,
    alertCallback: (msg: string, title: string) => void,
    opts?: any
  ): boolean => {
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
                executeSaveTransaction(opts);
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

                      executeSaveTransaction(opts);
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

                        executeSaveTransaction(opts);
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
        return true;
      }
    }
    return false;
  };

  return {
    checkOverBudget,
  };
}
