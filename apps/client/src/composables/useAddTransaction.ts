import { toRef, onMounted, ref } from "vue";
import { useSplit } from "./useSplit";
import { useOcr } from "./useOcr";
import { periods, transactions } from "../js/api";
import { useShareStore } from "../js/shareStore";
import { useTransactionForm } from "./useTransactionForm";
import { useTransactionSubmit } from "./useTransactionSubmit";
import { queueTextOcrTransaction } from "../js/utils/offlineQueue";
import { compressImage } from "../js/utils/image";
import { f7 } from "framework7-vue";

export function useAddTransaction(routeQueryAllocId?: string) {
  const {
    loadingEnvelopes,
    allocations,
    currentPeriodId,
    aiRecommendationText,
    form,
    setSource,
    selectEnvelope,
    initDateTime,
    loadEnvelopes,
  } = useTransactionForm(routeQueryAllocId);

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
    ocrConfidence,
    ocrHighlightedFields,
    ocrItems,
    currentOcrSessionId,
    fileToBase64,
    processOcrResult,
    handleOcrFileChange,
    localImagePreviewUrl,
    clearOcrPreview,
  } = useOcr();

  const filterSufficientOnly = ref(false);

  const { submitting, saveTransaction } = useTransactionSubmit(
    form,
    currentPeriodId,
    isSplit,
    splitRemaining,
    splitItems,
    splitTotal,
    allocations,
    filterSufficientOnly
  );

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
    filterSufficientOnly.value = false;
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
    filterSufficientOnly.value = false;
    clearOcrPreview();
    const fileInput = document.getElementById(fileInputId) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
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
    await loadEnvelopes((msg, title) => f7.dialog.alert(msg, title));

    // Check for shared data from Native share store
    const { sharedData, clearSharedData } = useShareStore();
    if (sharedData.value) {
      const data = { ...sharedData.value };
      clearSharedData();

      if (data.type === "image" || data.type === "pdf") {
        if (!navigator.onLine) {
          ocrStatus.value = "";
          f7.dialog.alert(
            "Pemrosesan foto struk memerlukan koneksi internet. Foto Anda tersimpan aman di galeri. Silakan catat nominalnya secara manual saat ini.",
            "Offline"
          );
          return;
        }

        const sessionId = ++currentOcrSessionId.value;
        ocrStatus.value = "🔄 Mengambil struk dari share target...";
        form.source = "ocr";

        clearOcrPreview();
        localImagePreviewUrl.value = `data:${data.mimeType};base64,${data.base64}`;

        let base64ToSend = data.base64!;
        let mimeTypeToSend = data.mimeType!;

        try {
          if (data.base64 && data.mimeType && data.type === "image") {
            ocrStatus.value = "⚡ Mengompresi gambar...";
            const byteCharacters = atob(data.base64);
            const byteArrays = [];
            for (let offset = 0; offset < byteCharacters.length; offset += 512) {
              const slice = byteCharacters.slice(offset, offset + 512);
              const byteNumbers = new Array(slice.length);
              for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              byteArrays.push(byteArray);
            }
            const blob = new Blob(byteArrays, { type: data.mimeType });
            const compressedBlob = await compressImage(blob);
            if (sessionId !== currentOcrSessionId.value) return;
            base64ToSend = await fileToBase64(compressedBlob);
            mimeTypeToSend = compressedBlob.type;
          }
        } catch (compressErr) {
          console.warn("Gagal mengompresi gambar share target:", compressErr);
        }

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
            base64ToSend,
            mimeTypeToSend,
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
        if (!navigator.onLine) {
          queueTextOcrTransaction(data.text);
          ocrStatus.value = "✅ Teks struk offline disimpan dalam antrean sinkronisasi.";
          f7.toast
            .create({
              text: "Koneksi offline. Teks struk disimpan ke antrean sinkronisasi.",
              closeTimeout: 3000,
              position: "bottom",
            })
            .open();
          return;
        }

        const sessionId = ++currentOcrSessionId.value;
        ocrStatus.value = "🔄 Menganalisis teks yang dibagikan...";
        form.source = "ocr";

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
          const result = await transactions.parseText(data.text, envelopeCandidates);
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
          ocrStatus.value = "❌ Gagal menganalisis teks. Masukkan manual saja.";
          console.error("Gagal parseText share target:", err);
          form.note = data.text;
        }
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
            if (intent.files.length > 5) {
              f7.dialog.alert(
                "Batas maksimal pengunggahan adalah 5 file sekaligus. Pengunggahan dibatalkan.",
                "Batas File Terlampaui"
              );
              try {
                await SendIntent.clearSendIntent();
              } catch {}
              return;
            }
            if (!navigator.onLine) {
              f7.dialog.alert(
                "Pemrosesan foto struk memerlukan koneksi internet. Foto Anda tersimpan aman di galeri. Silakan catat nominalnya secara manual saat ini.",
                "Offline"
              );
              return;
            }

            const sessionId = ++currentOcrSessionId.value;
            const fileObj = intent.files[0];
            ocrStatus.value = "🔄 Mengambil gambar dari share target...";
            form.source = "ocr";

            // Fetch the file using its URL
            const res = await fetch(fileObj.url);
            const blob = await res.blob();
            clearOcrPreview();
            localImagePreviewUrl.value = URL.createObjectURL(blob);

            ocrStatus.value = "⚡ Mengompresi gambar...";
            const compressedBlob = await compressImage(blob);
            if (sessionId !== currentOcrSessionId.value) return;

            const base64 = await fileToBase64(compressedBlob);

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
              compressedBlob.type,
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

    // Check for shared image or text from PWA Share Target
    if ("caches" in window) {
      try {
        const cache = await caches.open("shared-image-cache");
        const sharedResponse = await cache.match("/shared-image");
        if (sharedResponse) {
          if (!navigator.onLine) {
            f7.dialog.alert(
              "Pemrosesan foto struk memerlukan koneksi internet. Foto Anda tersimpan aman di galeri. Silakan catat nominalnya secara manual saat ini.",
              "Offline"
            );
            await cache.delete("/shared-image");
            return;
          }

          const sessionId = ++currentOcrSessionId.value;
          ocrStatus.value = "🔄 Mengambil gambar struk yang dibagikan...";
          form.source = "ocr";

          const blob = await sharedResponse.blob();
          clearOcrPreview();
          localImagePreviewUrl.value = URL.createObjectURL(blob);

          ocrStatus.value = "⚡ Mengompresi gambar...";
          const compressedBlob = await compressImage(blob);
          if (sessionId !== currentOcrSessionId.value) return;

          const base64 = await fileToBase64(compressedBlob);

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

          try {
            const result = await transactions.ocr(
              base64,
              compressedBlob.type,
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
          } catch (err: any) {
            if (sessionId !== currentOcrSessionId.value) return;
            ocrStatus.value = "❌ Gagal memproses gambar terbagi. Silakan isi manual.";
            console.error("Shared target image processing error:", err);
            await cache.delete("/shared-image");
          }
        }

        const sharedTextResponse = await cache.match("/shared-text");
        if (sharedTextResponse) {
          const textData = await sharedTextResponse.json();
          const textToParse =
            `${textData.title || ""}\n${textData.text || ""}\n${textData.url || ""}`.trim();

          if (!navigator.onLine) {
            queueTextOcrTransaction(textToParse);
            ocrStatus.value = "✅ Teks struk offline disimpan dalam antrean sinkronisasi.";
            f7.toast
              .create({
                text: "Koneksi offline. Teks struk disimpan ke antrean sinkronisasi.",
                closeTimeout: 3000,
                position: "bottom",
              })
              .open();
            await cache.delete("/shared-text");
            return;
          }

          const sessionId = ++currentOcrSessionId.value;
          ocrStatus.value = "🔄 Menganalisis teks yang dibagikan...";
          form.source = "ocr";

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
            const result = await transactions.parseText(textToParse, envelopeCandidates);
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
            await cache.delete("/shared-text");
          } catch (err: any) {
            if (sessionId !== currentOcrSessionId.value) return;
            ocrStatus.value = "❌ Gagal menganalisis teks. Masukkan manual saja.";
            console.error("Gagal parseText share target:", err);
            form.note = textToParse;
            await cache.delete("/shared-text");
          }
        }
      } catch (err: any) {
        ocrStatus.value = "❌ Gagal memproses data terbagi. Silakan isi manual.";
        console.error("Shared target processing error:", err);
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
    ocrConfidence,
    ocrHighlightedFields,
    ocrItems,
    filterSufficientOnly,
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
