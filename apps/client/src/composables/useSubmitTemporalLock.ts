import { f7 } from "framework7-vue";
import { periods } from "../js/api";

export function useSubmitTemporalLock() {
  const checkTemporalLock = async (
    form: { date: string; note: string },
    alertCallback: (msg: string, title: string) => void,
    onProceed: (opts?: { forceWriteClosedPeriod?: boolean; targetPeriodId?: string }) => void,
    onCancel: () => void
  ): Promise<boolean> => {
    try {
      if (!navigator.onLine) return false;

      const periodList = await periods.list();
      const txDate = new Date(form.date);
      const txYear = txDate.getFullYear();
      const txMonth = txDate.getMonth() + 1;
      const txPeriod = periodList.find(p => p.year === txYear && p.month === txMonth);

      if (txPeriod && txPeriod.isClosed) {
        const activePeriod = periodList.find(p => !p.isClosed);
        if (!activePeriod) {
          alertCallback("Tidak ada periode anggaran aktif. Buka periode dulu.", "Oops");
          onCancel();
          return true;
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
            onProceed();
          } else {
            onProceed({
              forceWriteClosedPeriod: true,
              targetPeriodId: txPeriod.id,
            });
          }
        };

        const buttons: Array<{ text: string; color?: string; onClick?: () => void }> = [];

        buttons.push({
          text: "Catat di Bulan Ini (Disarankan)",
          onClick: () => proceedWithDecision("A"),
        });

        if (monthDiff === 1) {
          buttons.push({
            text: "Buka Periode Lalu & Hitung Ulang Saldo",
            onClick: () => proceedWithDecision("B"),
          });
        }

        buttons.push({
          text: "Batal",
          color: "red",
          onClick: onCancel,
        });

        const title = "📅 Tanggal Transaksi Berbeda";
        let message = `Transaksi ini terjadi pada <strong>${new Date(form.date).toLocaleDateString("id-ID")}</strong>, di mana catatan keuangan untuk bulan tersebut sudah ditutup bersama pasangan Anda.<br><br>Pilih cara pencatatannya:`;
        if (monthDiff > 1) {
          message += `<br><br><span style="color: #d9383a; font-size: 11px; font-weight: 600;">⚠️ Opsi Buka Periode Lalu dinonaktifkan karena periode tersebut sudah ditutup lebih dari 1 bulan yang lalu.</span>`;
        }

        f7.dialog
          .create({
            title,
            text: message,
            verticalButtons: true,
            buttons,
          })
          .open();

        return true;
      }
    } catch (e: any) {
      console.error("Gagal memeriksa periode:", e);
    }
    return false;
  };

  return {
    checkTemporalLock,
  };
}
