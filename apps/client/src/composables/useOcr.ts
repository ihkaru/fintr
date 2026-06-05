import { ref, Ref } from "vue";
import { transactions } from "../js/api";

export function useOcr() {
  const ocrStatus = ref("");
  const currentOcrSessionId = ref(0);
  const localImagePreviewUrl = ref("");

  const clearOcrPreview = () => {
    if (localImagePreviewUrl.value) {
      if (localImagePreviewUrl.value.startsWith("blob:")) {
        URL.revokeObjectURL(localImagePreviewUrl.value);
      }
      localImagePreviewUrl.value = "";
    }
  };

  const fileToBase64 = (file: Blob | File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
        resolve(res.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processOcrResult = (
    result: any,
    form: {
      amount: number | "";
      merchant: string;
      date: string;
      allocationId: string;
      note?: string;
      rawImageKey?: string;
    },
    isSplit: Ref<boolean> | boolean,
    splitItems: Ref<Array<{ allocationId: string; amount: number | "" }>>,
    allocations: Array<{ id: string; envelopeName: string }>,
    aiRecommendationText: Ref<string>
  ) => {
    const isSplitVal = typeof isSplit === "boolean" ? isSplit : isSplit.value;

    if (result.amount) {
      form.amount = result.amount;
      if (isSplitVal && splitItems.value.length > 0) {
        // Pre-fill the first split item with total and let user adjust
        splitItems.value[0].amount = result.amount;
      }
    }
    if (result.merchant) {
      form.merchant = result.merchant;
    }
    if (result.date) {
      const dt = new Date(result.date);
      dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
      form.date = dt.toISOString().slice(0, 16);
    }
    if (result.recommendedEnvelopeId) {
      form.allocationId = result.recommendedEnvelopeId;
      if (isSplitVal && splitItems.value.length > 0) {
        splitItems.value[0].allocationId = result.recommendedEnvelopeId;
      }

      const matched = allocations.find(a => a.id === result.recommendedEnvelopeId);
      if (matched) {
        aiRecommendationText.value = `💡 AI merekomendasikan amplop "${matched.envelopeName}" karena: ${result.analysisReasoning || "Kecocokan transaksi"}`;
      }
    } else {
      aiRecommendationText.value = "";
    }
    if (result.formattedNote) {
      form.note = result.formattedNote;
    }
    if (result.receiptUrl) {
      form.rawImageKey = result.receiptUrl;
    }
  };

  const handleOcrFileChange = async (
    e: Event,
    allocations: Array<{ id: string; envelopeName: string }>,
    form: {
      amount: number | "";
      merchant: string;
      date: string;
      allocationId: string;
      source: "manual" | "ocr";
      note?: string;
      rawImageKey?: string;
    },
    isSplit: Ref<boolean> | boolean,
    splitItems: Ref<Array<{ allocationId: string; amount: number | "" }>>,
    aiRecommendationText: Ref<string>,
    alertCallback: (msg: string, title: string) => void
  ) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const sessionId = ++currentOcrSessionId.value;
    ocrStatus.value = "🔄 Mengirim gambar...";
    aiRecommendationText.value = "";

    // Set local image preview URL instantly
    clearOcrPreview();
    localImagePreviewUrl.value = URL.createObjectURL(file);

    try {
      const base64 = await fileToBase64(file);
      const envelopeCandidates = allocations.map(a => ({
        id: a.id,
        name: a.envelopeName,
      }));

      const result = await transactions.ocr(base64, file.type, envelopeCandidates, statusText => {
        if (sessionId !== currentOcrSessionId.value) return;
        ocrStatus.value = `🔄 ${statusText}`;
      });

      if (sessionId !== currentOcrSessionId.value) return;
      processOcrResult(result, form, isSplit, splitItems, allocations, aiRecommendationText);
      ocrStatus.value = `✅ Terdeteksi (Akurasi: ${result.confidence}). Lengkapi jika salah.`;
    } catch (err: any) {
      if (sessionId !== currentOcrSessionId.value) return;
      ocrStatus.value = "❌ Gagal mendeteksi. Masukkan manual saja.";
      alertCallback("Kesalahan OCR: " + err.message, "Gagal Scan");
    }
  };

  return {
    ocrStatus,
    currentOcrSessionId,
    fileToBase64,
    processOcrResult,
    handleOcrFileChange,
    localImagePreviewUrl,
    clearOcrPreview,
  };
}
