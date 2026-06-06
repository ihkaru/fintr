import { ref } from "vue";
import { transactions, periods } from "../api";
import { f7 } from "framework7-vue";

export interface OfflineTransaction {
  id: string;
  type: "normal" | "split" | "text_ocr";
  data: any;
  createdAt: string;
  errorMessage?: string;
  retryCount?: number;
}

const QUEUE_KEY = "fintr_offline_queue";
const FAILED_QUEUE_KEY = "fintr_offline_failed_queue";
const isSyncing = ref(false);

function getQueue(): OfflineTransaction[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("[OfflineSync] Failed to read queue from localStorage:", err);
    return [];
  }
}

function saveQueue(queue: OfflineTransaction[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error("[OfflineSync] Failed to write queue to localStorage:", err);
  }
}

export function getFailedQueue(): OfflineTransaction[] {
  try {
    const raw = localStorage.getItem(FAILED_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("[OfflineSync] Failed to read failed queue from localStorage:", err);
    return [];
  }
}

export function saveFailedQueue(queue: OfflineTransaction[]) {
  try {
    localStorage.setItem(FAILED_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error("[OfflineSync] Failed to write failed queue to localStorage:", err);
  }
}

export function pushToFailedQueue(item: OfflineTransaction, errorMessage: string) {
  const failedQueue = getFailedQueue();
  if (!failedQueue.some(x => x.id === item.id)) {
    failedQueue.push({
      ...item,
      errorMessage,
    });
    saveFailedQueue(failedQueue);
    window.dispatchEvent(new CustomEvent("fintr:offline-failed-changed"));
  }
}

export function removeFailedItem(id: string) {
  const failedQueue = getFailedQueue();
  const filtered = failedQueue.filter(x => x.id !== id);
  saveFailedQueue(filtered);
  window.dispatchEvent(new CustomEvent("fintr:offline-failed-changed"));
}

export function clearFailedQueue() {
  saveFailedQueue([]);
  window.dispatchEvent(new CustomEvent("fintr:offline-failed-changed"));
}

export function retryFailedItem(id: string) {
  const failedQueue = getFailedQueue();
  const itemIndex = failedQueue.findIndex(x => x.id === id);
  if (itemIndex === -1) return;

  const item = failedQueue[itemIndex];
  failedQueue.splice(itemIndex, 1);
  saveFailedQueue(failedQueue);
  window.dispatchEvent(new CustomEvent("fintr:offline-failed-changed"));

  const queue = getQueue();
  const cleanItem = { ...item };
  delete (cleanItem as any).errorMessage;
  cleanItem.retryCount = 0;
  queue.push(cleanItem);
  saveQueue(queue);

  if (navigator.onLine) {
    syncOfflineTransactions();
  } else {
    f7.toast
      .create({
        text: "Kembali dimasukkan ke antrean. Akan disinkronkan saat online.",
        closeTimeout: 3000,
        position: "bottom",
      })
      .open();
  }
}

export function queueTransaction(data: any) {
  const queue = getQueue();
  const newItem: OfflineTransaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    type: "normal",
    data,
    createdAt: new Date().toISOString(),
  };
  queue.push(newItem);
  saveQueue(queue);
  console.log("[OfflineSync] Queued normal transaction offline:", newItem);
}

export function queueSplitTransaction(data: any) {
  const queue = getQueue();
  const newItem: OfflineTransaction = {
    id: `split_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    type: "split",
    data,
    createdAt: new Date().toISOString(),
  };
  queue.push(newItem);
  saveQueue(queue);
  console.log("[OfflineSync] Queued split transaction offline:", newItem);
}

export function queueTextOcrTransaction(text: string) {
  const queue = getQueue();
  const newItem: OfflineTransaction = {
    id: `text_ocr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    type: "text_ocr",
    data: { text },
    createdAt: new Date().toISOString(),
  };
  queue.push(newItem);
  saveQueue(queue);
  console.log("[OfflineSync] Queued text OCR transaction offline:", newItem);
}

export function getQueueCount(): number {
  return getQueue().length;
}

export async function syncOfflineTransactions() {
  if (isSyncing.value) return;

  const queue = getQueue();
  if (queue.length === 0) return;

  if (!navigator.onLine) {
    console.log("[OfflineSync] App is offline, skipping synchronization.");
    return;
  }

  isSyncing.value = true;
  console.log(`[OfflineSync] Starting sync of ${queue.length} transactions...`);

  let successCount = 0;
  const remainingQueue: OfflineTransaction[] = [];

  for (const item of queue) {
    // Check if network is lost during loop
    if (!navigator.onLine) {
      remainingQueue.push(item);
      continue;
    }

    let synced = false;
    let syncError: any = null;

    try {
      if (item.type === "normal") {
        await transactions.create(item.data);
      } else if (item.type === "split") {
        await transactions.createSplit(item.data);
      } else if (item.type === "text_ocr") {
        const allPeriods = await periods.list();
        const activePeriod = allPeriods.find(p => !p.isClosed);
        if (!activePeriod) {
          throw new Error("Tidak ada periode aktif.");
        }
        const activePeriodDetail = await periods.getDetail(activePeriod.id);
        const envelopeCandidates = activePeriodDetail.allocations.map(a => ({
          id: a.id,
          name: a.envelopeName,
        }));

        const result = await transactions.parseText(item.data.text, envelopeCandidates);

        const amount = result.amount || 0;
        const targetAllocationId =
          result.recommendedEnvelopeId || activePeriodDetail.allocations[0]?.id;

        if (!targetAllocationId) {
          throw new Error("Tidak ada alokasi tersedia.");
        }

        const txPayload = {
          periodId: activePeriod.id,
          allocationId: targetAllocationId,
          amount,
          merchant: result.merchant || "Share Target Offline",
          note: result.formattedNote || item.data.text,
          transactionAt: result.date
            ? new Date(result.date).toISOString()
            : new Date(item.createdAt).toISOString(),
          source: "ocr",
        };

        await transactions.create(txPayload);
      }
      synced = true;
      console.log(`[OfflineSync] Successfully synced transaction ${item.id}`);
    } catch (err: any) {
      syncError = err;
      if (err.message === "PERIOD_CLOSED") {
        console.log(
          `[OfflineSync] Period is closed. Attempting recovery for transaction ${item.id}`
        );
        try {
          const allPeriods = await periods.list();
          const activePeriod = allPeriods.find(p => !p.isClosed);
          if (!activePeriod) {
            throw new Error("Tidak ada periode aktif yang terbuka.", { cause: err });
          }

          if (item.type === "normal") {
            const oldPeriodDetail = await periods.getDetail(item.data.periodId);
            const oldAllocation = oldPeriodDetail.allocations.find(
              a => a.id === item.data.allocationId
            );
            if (!oldAllocation) {
              throw new Error("Kategori amplop asal tidak ditemukan di periode lama.", {
                cause: err,
              });
            }

            const activePeriodDetail = await periods.getDetail(activePeriod.id);
            const newAllocation = activePeriodDetail.allocations.find(
              a => a.templateId === oldAllocation.templateId
            );
            if (!newAllocation) {
              throw new Error(
                `Kategori amplop '${oldAllocation.envelopeName}' tidak aktif atau tidak ditemukan di periode baru.`,
                { cause: err }
              );
            }

            item.data.periodId = activePeriod.id;
            item.data.allocationId = newAllocation.id;

            await transactions.create(item.data);
            synced = true;
            console.log(
              `[OfflineSync] Successfully recovered and synced normal transaction ${item.id} to new period ${activePeriod.id}`
            );
          } else if (item.type === "split") {
            // Split transaction recovery
            const oldPeriodCache: Record<string, any> = {};
            const activePeriodDetail = await periods.getDetail(activePeriod.id);

            for (const subTx of item.data.transactions) {
              const subPeriodId = subTx.periodId;
              const targetPeriod = allPeriods.find(p => p.id === subPeriodId);
              if (targetPeriod && targetPeriod.isClosed) {
                if (!oldPeriodCache[subPeriodId]) {
                  oldPeriodCache[subPeriodId] = await periods.getDetail(subPeriodId);
                }
                const oldAllocation = oldPeriodCache[subPeriodId].allocations.find(
                  (a: any) => a.id === subTx.allocationId
                );
                if (oldAllocation) {
                  const newAllocation = activePeriodDetail.allocations.find(
                    a => a.templateId === oldAllocation.templateId
                  );
                  if (newAllocation) {
                    subTx.periodId = activePeriod.id;
                    subTx.allocationId = newAllocation.id;
                  }
                }
              }
            }

            await transactions.createSplit(item.data);
            synced = true;
            console.log(
              `[OfflineSync] Successfully recovered and synced split transaction ${item.id} to new period ${activePeriod.id}`
            );
          }
        } catch (recoveryErr: any) {
          syncError = recoveryErr;
          const isNetworkError =
            recoveryErr instanceof TypeError ||
            recoveryErr.message?.toLowerCase().includes("failed to fetch") ||
            recoveryErr.message?.toLowerCase().includes("network error") ||
            recoveryErr.message?.toLowerCase().includes("load failed");

          if (isNetworkError) {
            console.warn(
              `[OfflineSync] Network error during recovery of ${item.id}. Postponing sync.`,
              recoveryErr
            );
            remainingQueue.push(item);
            const index = queue.indexOf(item);
            if (index !== -1) {
              remainingQueue.push(...queue.slice(index + 1));
            }
            break;
          } else {
            console.error(`[OfflineSync] Recovery failed for transaction ${item.id}:`, recoveryErr);
            // Format message so the unified toast below is descriptive
            syncError.message = `Gagal pemulihan periode: ${recoveryErr.message}`;
          }
        }
      }
    }

    if (synced) {
      successCount++;
    } else {
      // If not synced and not already handled network recovery break above
      const isNetworkError =
        syncError instanceof TypeError ||
        syncError?.message?.toLowerCase().includes("failed to fetch") ||
        syncError?.message?.toLowerCase().includes("network error") ||
        syncError?.message?.toLowerCase().includes("load failed");

      if (isNetworkError) {
        // Skip breaking again if already pushed to remainingQueue
        if (!remainingQueue.includes(item)) {
          console.warn(
            `[OfflineSync] Network error during sync of ${item.id}. Postponing sync.`,
            syncError
          );
          remainingQueue.push(item);
          const index = queue.indexOf(item);
          if (index !== -1) {
            remainingQueue.push(...queue.slice(index + 1));
          }
        }
        break;
      } else if (syncError && syncError.message !== "PERIOD_CLOSED") {
        item.retryCount = (item.retryCount || 0) + 1;
        if (item.retryCount < 3) {
          console.warn(
            `[OfflineSync] Business/Validation error for transaction ${item.id}. Retry attempt ${item.retryCount}/3. Postponing.`,
            syncError
          );
          remainingQueue.push(item);
        } else {
          console.error(
            `[OfflineSync] Business/Validation error for transaction ${item.id} after 3 attempts. Pushing to failed queue.`,
            syncError
          );
          pushToFailedQueue(item, syncError.message);
          f7.toast
            .create({
              text: `Gagal menyinkronkan transaksi offline (${item.data.merchant || "Pengeluaran"}) setelah 3 kali mencoba: ${syncError.message}`,
              closeTimeout: 5000,
              position: "bottom",
            })
            .open();
        }
      }
    }
  }

  saveQueue(remainingQueue);
  isSyncing.value = false;

  if (successCount > 0) {
    // Dispatch global events to refresh views
    window.dispatchEvent(new CustomEvent("fintr:transaction-saved"));
    window.dispatchEvent(new CustomEvent("fintr:envelope-changed"));

    f7.toast
      .create({
        text: `Sync Selesai: Berhasil mengunggah ${successCount} transaksi offline.`,
        closeTimeout: 3000,
        position: "bottom",
      })
      .open();

    // Check for post-sync over-budget
    setTimeout(async () => {
      try {
        const allPeriods = await periods.list();
        const activePeriod = allPeriods.find(p => !p.isClosed);
        if (activePeriod) {
          const detail = await periods.getDetail(activePeriod.id);
          const overBudgetAllocations = detail.allocations.filter(a => parseFloat(a.remaining) < 0);
          if (overBudgetAllocations.length > 0) {
            const names = overBudgetAllocations
              .map(a => `${a.envelopeName} (Rp ${parseFloat(a.remaining).toLocaleString("id-ID")})`)
              .join(", ");
            f7.toast
              .create({
                text: `Peringatan: Kategori berikut over-budget setelah sinkronisasi: ${names}`,
                closeTimeout: 5000,
                position: "bottom",
              })
              .open();
          }
        }
      } catch (e) {
        console.error("[OfflineSync] Failed to check for post-sync over-budget:", e);
      }
    }, 1500);
  }
}

export function registerOnlineListener() {
  window.addEventListener("online", () => {
    console.log("[OfflineSync] Connection restored. Triggering sync...");
    syncOfflineTransactions();
  });

  // Also attempt sync on initial load if online
  if (navigator.onLine) {
    syncOfflineTransactions();
  }
}
