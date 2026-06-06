export function useSubmitValidation() {
  const validateForm = (
    form: { amount: number | ""; allocationId: string },
    isSplit: boolean,
    splitRemaining: number,
    splitItems: Array<{ allocationId: string; amount: number | "" }>,
    alertCallback: (msg: string, title: string) => void
  ): boolean => {
    if (!form.amount || form.amount <= 0) {
      alertCallback("Jumlah pengeluaran harus lebih besar dari 0", "Oops");
      return false;
    }

    if (isSplit) {
      if (splitRemaining !== 0) {
        alertCallback(
          `Jumlah nominal pecahan tidak sama dengan total nominal transaksi (selisih: Rp ${splitRemaining}). Silakan sesuaikan pembagian Anda.`,
          "Nominal Tidak Pas"
        );
        return false;
      }

      for (let i = 0; i < splitItems.length; i++) {
        const item = splitItems[i];
        if (!item.allocationId) {
          alertCallback(`Pilih amplop untuk Bagian #${i + 1}`, "Oops");
          return false;
        }
        if (!item.amount || item.amount <= 0) {
          alertCallback(`Nominal Bagian #${i + 1} harus lebih besar dari 0`, "Oops");
          return false;
        }
      }
    } else {
      if (!form.allocationId) {
        alertCallback("Pilih amplop alokasi pengeluaran", "Oops");
        return false;
      }
    }

    return true;
  };

  return {
    validateForm,
  };
}
