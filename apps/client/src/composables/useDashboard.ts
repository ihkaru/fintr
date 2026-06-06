import { ref } from "vue";
import { f7 } from "framework7-vue";
import { periods, transactions as txnApi, reconcile, household, getUser } from "../js/api";
import type { Transaction, PeriodDetail } from "../js/api";
import { formatRp } from "../js/routes";

export function useDashboard() {
  const loading = ref(true);
  const summary = ref({
    remaining: 0,
    allocated: 0,
    spent: 0,
  });
  const allocationsData = ref<PeriodDetail["allocations"]>([]);
  const recentTxns = ref<Transaction[]>([]);
  const reconcileData = ref<any>(null);
  const currentPeriodId = ref<string | null>(null);

  // Partner Status Bar State
  const currentUserProfile = ref<any>(getUser());
  const partnerProfile = ref<any>(null);
  const householdName = ref("");

  const loadDashboard = async (
    onLoaded?: (currentPeriod: any, allocations: any[], txns: any[]) => void
  ) => {
    try {
      const periodList = await periods.list();
      const currentPeriod = periodList.find(p => !p.isClosed) || periodList[0];

      if (!currentPeriod) {
        loading.value = false;
        return;
      }

      currentPeriodId.value = currentPeriod.id;

      // Fetch details
      const [detail, txns, recDiff, householdRes] = await Promise.all([
        periods.getDetail(currentPeriod.id),
        txnApi.list({ periodId: currentPeriod.id, limit: 500 }),
        reconcile.diff().catch(() => null),
        household.get().catch(() => null),
      ]);

      // Update state
      summary.value = {
        remaining: parseFloat(detail.summary.totalRemaining),
        allocated: parseFloat(detail.summary.totalAllocated),
        spent: parseFloat(detail.summary.totalSpent),
      };
      allocationsData.value = detail.allocations;
      recentTxns.value = txns.slice(0, 5);
      reconcileData.value = recDiff;

      // Process household members and profiles
      if (householdRes) {
        const currentUserId = getUser()?.id;
        const members = householdRes.members || [];
        const me = members.find((m: any) => m.userId === currentUserId);
        const partner = members.find((m: any) => m.userId !== currentUserId);

        currentUserProfile.value = me || getUser();
        partnerProfile.value = partner || null;
        householdName.value = householdRes.household?.name || "";
      } else {
        currentUserProfile.value = getUser();
        partnerProfile.value = null;
        householdName.value = "";
      }

      if (typeof onLoaded === "function") {
        onLoaded(currentPeriod, detail.allocations, txns);
      }
    } catch (err) {
      console.error("Gagal memuat data dasbor:", err);
    } finally {
      loading.value = false;
    }
  };

  const navigateToAddTransaction = () => {
    if (f7.views.main && f7.views.main.router) {
      f7.views.main.router.navigate("/add-transaction/");
    }
  };

  const openAddTransactionWithEnvelope = (allocationId: string) => {
    const allocation = allocationsData.value.find(a => a.id === allocationId);
    if (allocation && (allocation as any).isActive === false) {
      f7.dialog.alert(
        "Amplop ini sudah dinonaktifkan dari template master. Anda tidak dapat mencatat transaksi baru di dalamnya.",
        "Amplop Ditutup"
      );
      return;
    }
    if (f7.views.main && f7.views.main.router) {
      f7.views.main.router.navigate(`/add-transaction/?allocationId=${allocationId}`);
    }
  };

  const deleteTxn = async (id: string) => {
    try {
      f7.dialog.preloader("Menghapus transaksi...");
      await txnApi.remove(id);
      f7.dialog.close();

      f7.toast
        .create({
          text: "Transaksi berhasil dihapus! 🗑️",
          closeTimeout: 2000,
          destroyOnClose: true,
        })
        .open();

      await loadDashboard();
    } catch (err: any) {
      f7.dialog.close();
      f7.dialog.alert("Gagal menghapus transaksi: " + err.message, "Oops");
    }
  };

  const handleTransactionSaved = async (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (!detail) {
      // SSE update from partner, reload dashboard data
      await loadDashboard();
      return;
    }

    // Only run if this page's view is currently the active view
    if (f7.views.current?.router?.currentRoute?.path !== "/") return;

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
            await Promise.all(ids.map((id: string) => txnApi.remove(id)));
            f7.dialog.close();

            f7.toast
              .create({
                text: "🔄 Transaksi berhasil dibatalkan!",
                closeTimeout: 2000,
                destroyOnClose: true,
              })
              .open();

            await loadDashboard();
          } catch (err: any) {
            f7.dialog.close();
            f7.dialog.alert("Gagal membatalkan transaksi: " + err.message, "Oops");
          }
        },
      },
    });
    toast.open();
  };

  return {
    loading,
    summary,
    allocationsData,
    recentTxns,
    reconcileData,
    currentPeriodId,
    currentUserProfile,
    partnerProfile,
    householdName,
    loadDashboard,
    navigateToAddTransaction,
    openAddTransactionWithEnvelope,
    deleteTxn,
    handleTransactionSaved,
  };
}
