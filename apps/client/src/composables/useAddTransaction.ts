import { ref, reactive, toRef, onMounted, watch } from "vue";
import { useSplit } from "./useSplit";
import { useOcr } from "./useOcr";
import { periods, transactions, PeriodDetail } from "../js/api";
import { useShareStore, SharedData } from "../js/shareStore";

export function useAddTransaction(routeQueryAllocId?: string) {
  const loadingEnvelopes = ref(true);
  const submitting = ref(false);
  const allocations = ref<PeriodDetail["allocations"]>([]);
  const currentPeriodId = ref<string>("");
  const aiRecommendationText = ref("");

  const form = reactive({
    amount: "" as number | "",
    merchant: "",
    note: "",
    date: "",
    source: "manual" as "manual" | "ocr",
    allocationId: "" as string,
    rawImageKey: "",
  });

  const {
    isSplit,
    splitItems,
    splitTotal,
    splitRemaining,
    toggleSplit,
    addSplitItem,
    removeSplitItem,
  } = useSplit(toRef(form, "amount"), toRef(form, "allocationId"));

  const {
    ocrStatus,
    currentOcrSessionId,
    fileToBase64,
    processOcrResult,
    handleOcrFileChange,
    localImagePreviewUrl,
    clearOcrPreview,
  } = useOcr();

  const setSource = (src: "manual" | "ocr") => {
    form.source = src;
  };

  const selectEnvelope = (id: string) => {
    form.allocationId = id;
  };

  const initDateTime = () => {
    const local = new Date();
    local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
    form.date = local.toISOString().slice(0, 16);
  };

  const resetForm = (fileInputId?: string) => {
    currentOcrSessionId.value++;
    form.amount = "";
    form.merchant = "";
    form.note = "";
    form.rawImageKey = "";
    initDateTime();
    if (allocations.value.length > 0) {
      form.allocationId = allocations.value[0].id;
    } else {
      form.allocationId = "";
    }
    isSplit.value = false;
    splitItems.value = [];
    ocrStatus.value = "";
    aiRecommendationText.value = "";
    clearOcrPreview();

    if (fileInputId) {
      const fileInput = document.getElementById(fileInputId) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    }
  };

  const clearReceipt = (fileInputId: string = "ocr-file-input") => {
    form.rawImageKey = "";
    ocrStatus.value = "";
    clearOcrPreview();
    const fileInput = document.getElementById(fileInputId) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const loadEnvelopes = async (alertCallback: (msg: string, title: string) => void) => {
    try {
      const list = await periods.list();
      const current = list.find(p => !p.isClosed);
      if (!current) {
        alertCallback("Belum ada periode anggaran aktif. Buka periode dulu.", "Oops");
        return;
      }

      currentPeriodId.value = current.id;
      const detail = await periods.getDetail(current.id);
      allocations.value = detail.allocations;

      if (routeQueryAllocId) {
        form.allocationId = routeQueryAllocId;
      } else if (allocations.value.length > 0) {
        form.allocationId = allocations.value[0].id;
      }
    } catch (err: any) {
      console.error("Gagal memuat amplop:", err);
    } finally {
      loadingEnvelopes.value = false;
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

  const onOcrFileChange = async (e: Event, alertCallback: (msg: string, title: string) => void) => {
    await handleOcrFileChange(
      e,
      allocations.value,
      form,
      isSplit,
      splitItems,
      aiRecommendationText,
      alertCallback
    );
  };

  const onToggleSplit = () => {
    toggleSplit(allocations.value);
  };

  const onAddSplitItem = () => {
    addSplitItem(allocations.value[0]?.id || "");
  };

  const onRemoveSplitItem = (
    index: number,
    alertCallback: (msg: string, title: string) => void
  ) => {
    removeSplitItem(index, alertCallback);
  };

  // Setup Capacitor + PWA share intent handlers
  onMounted(async () => {
    initDateTime();

    // Check for shared data from Native share store
    const { sharedData, clearSharedData } = useShareStore();
    if (sharedData.value) {
      const data = { ...sharedData.value };
      clearSharedData();

      if (data.type === "image" || data.type === "pdf") {
        const sessionId = ++currentOcrSessionId.value;
        ocrStatus.value = "🔄 Mengambil struk dari share target...";
        form.source = "ocr";

        clearOcrPreview();
        localImagePreviewUrl.value = `data:${data.mimeType};base64,${data.base64}`;

        ocrStatus.value = "🔄 Mengirim gambar...";

        if (allocations.value.length === 0) {
          const list = await periods.list();
          const current = list.find(p => !p.isClosed);
          if (current) {
            currentPeriodId.value = current.id;
            const detail = await periods.getDetail(current.id);
            allocations.value = detail.allocations;
          }
        }

        const envelopeCandidates = allocations.value.map(a => ({
          id: a.id,
          name: a.envelopeName,
        }));

        try {
          const result = await transactions.ocr(
            data.base64!,
            data.mimeType!,
            envelopeCandidates,
            statusText => {
              if (sessionId !== currentOcrSessionId.value) return;
              ocrStatus.value = `🔄 ${statusText}`;
            }
          );

          if (sessionId !== currentOcrSessionId.value) return;
          processOcrResult(
            result,
            form,
            isSplit,
            splitItems,
            allocations.value,
            aiRecommendationText
          );
          ocrStatus.value = `✅ Terdeteksi (Akurasi: ${result.confidence}). Cek dan lengkapi jika salah.`;
        } catch (err: any) {
          if (sessionId !== currentOcrSessionId.value) return;
          ocrStatus.value = "❌ Gagal mendeteksi. Masukkan manual saja.";
          console.error("Gagal OCR share target:", err);
        }
      } else if (data.type === "text" && data.text) {
        form.note = data.text;
      }
      return; // Handled native share target
    }

    // Check Capacitor share intent if running on a native device
    const cap = (window as any).Capacitor;
    if (cap && cap.isNativePlatform()) {
      try {
        const SendIntent = cap.Plugins?.SendIntent;
        if (SendIntent) {
          const intent = await SendIntent.checkSendIntentReceived();
          if (intent && intent.files && intent.files.length > 0) {
            const sessionId = ++currentOcrSessionId.value;
            const fileObj = intent.files[0];
            ocrStatus.value = "🔄 Mengambil gambar dari share target...";
            form.source = "ocr";

            // Fetch the file using its URL
            const res = await fetch(fileObj.url);
            const blob = await res.blob();
            clearOcrPreview();
            localImagePreviewUrl.value = URL.createObjectURL(blob);
            const base64 = await fileToBase64(blob);

            if (sessionId !== currentOcrSessionId.value) return;
            ocrStatus.value = "🔄 Mengirim gambar...";

            if (allocations.value.length === 0) {
              const list = await periods.list();
              const current = list.find(p => !p.isClosed);
              if (current) {
                currentPeriodId.value = current.id;
                const detail = await periods.getDetail(current.id);
                allocations.value = detail.allocations;
              }
            }

            const envelopeCandidates = allocations.value.map(a => ({
              id: a.id,
              name: a.envelopeName,
            }));

            const result = await transactions.ocr(
              base64,
              blob.type,
              envelopeCandidates,
              statusText => {
                if (sessionId !== currentOcrSessionId.value) return;
                ocrStatus.value = `🔄 ${statusText}`;
              }
            );

            if (sessionId !== currentOcrSessionId.value) return;
            processOcrResult(
              result,
              form,
              isSplit,
              splitItems,
              allocations.value,
              aiRecommendationText
            );
            ocrStatus.value = `✅ Terdeteksi (Akurasi: ${result.confidence}). Cek dan lengkapi jika salah.`;
            return; // Skip PWA cache check if capacitor succeeded
          }
        }
      } catch (e) {
        console.error("Gagal memproses Capacitor share intent:", e);
      }
    }

    // Check for shared image from PWA Share Target
    if ("caches" in window) {
      try {
        const cache = await caches.open("shared-image-cache");
        const sharedResponse = await cache.match("/shared-image");
        if (sharedResponse) {
          const sessionId = ++currentOcrSessionId.value;
          ocrStatus.value = "🔄 Mengambil gambar struk yang dibagikan...";
          form.source = "ocr";

          const blob = await sharedResponse.blob();
          clearOcrPreview();
          localImagePreviewUrl.value = URL.createObjectURL(blob);
          const base64 = await fileToBase64(blob);

          if (sessionId !== currentOcrSessionId.value) return;
          ocrStatus.value = "🔄 Mengirim gambar...";

          if (allocations.value.length === 0) {
            const list = await periods.list();
            const current = list.find(p => !p.isClosed);
            if (current) {
              currentPeriodId.value = current.id;
              const detail = await periods.getDetail(current.id);
              allocations.value = detail.allocations;
            }
          }

          const envelopeCandidates = allocations.value.map(a => ({
            id: a.id,
            name: a.envelopeName,
          }));

          const result = await transactions.ocr(
            base64,
            blob.type,
            envelopeCandidates,
            statusText => {
              if (sessionId !== currentOcrSessionId.value) return;
              ocrStatus.value = `🔄 ${statusText}`;
            }
          );

          if (sessionId !== currentOcrSessionId.value) return;
          processOcrResult(
            result,
            form,
            isSplit,
            splitItems,
            allocations.value,
            aiRecommendationText
          );
          ocrStatus.value = `✅ Terdeteksi (Akurasi: ${result.confidence}). Cek dan lengkapi jika salah.`;

          // Clean up cache after successful extraction
          await cache.delete("/shared-image");
        }
      } catch (err: any) {
        ocrStatus.value = "❌ Gagal memproses gambar terbagi. Silakan isi manual.";
        console.error("Shared target processing error:", err);
        try {
          const cache = await caches.open("shared-image-cache");
          await cache.delete("/shared-image");
        } catch {
          // ignore cache delete failure
        }
      }
    }
  });

  return {
    loadingEnvelopes,
    submitting,
    allocations,
    currentPeriodId,
    aiRecommendationText,
    form,
    isSplit,
    splitItems,
    splitTotal,
    splitRemaining,
    ocrStatus,
    setSource,
    selectEnvelope,
    initDateTime,
    resetForm,
    loadEnvelopes,
    saveTransaction,
    onOcrFileChange,
    onToggleSplit,
    onAddSplitItem,
    onRemoveSplitItem,
    localImagePreviewUrl,
    clearOcrPreview,
    clearReceipt,
  };
}
