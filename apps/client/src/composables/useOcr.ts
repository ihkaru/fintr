import { ref, Ref } from "vue";
import { transactions } from "../js/api";

export function useOcr() {
  const ocrStatus = ref("");
  const ocrConfidence = ref<"high" | "medium" | "low" | "">("");
  const ocrHighlightedFields = ref({ amount: false, merchant: false, date: false });
  const ocrItems = ref<any[]>([]);
  const currentOcrSessionId = ref(0);
  const localImagePreviewUrl = ref("");

  const clearOcrPreview = () => {
    ocrConfidence.value = "";
    ocrHighlightedFields.value = { amount: false, merchant: false, date: false };
    ocrItems.value = [];
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
    splitItems: Ref<Array<{ allocationId: string; amount: number | ""; note?: string }>>,
    allocations: Array<{ id: string; envelopeName: string }>,
    aiRecommendationText: Ref<string>
  ) => {
    const isSplitVal = typeof isSplit === "boolean" ? isSplit : isSplit.value;

    ocrConfidence.value = result.confidence || "";
    ocrHighlightedFields.value = { amount: false, merchant: false, date: false };
    ocrItems.value = result.items || [];

    if (result.amount) {
      form.amount = result.amount;
      ocrHighlightedFields.value.amount = true;
      if (isSplitVal && splitItems.value.length > 0) {
        splitItems.value[0].amount = result.amount;
      }
    }
    if (result.merchant) {
      form.merchant = result.merchant;
      ocrHighlightedFields.value.merchant = true;
    }
    if (result.date) {
      const dt = new Date(result.date);
      dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
      form.date = dt.toISOString().slice(0, 16);
      ocrHighlightedFields.value.date = true;
    }
    if (result.recommendedEnvelopeId) {
      const matched = allocations.find(a => a.id === result.recommendedEnvelopeId);
      if (matched) {
        form.allocationId = result.recommendedEnvelopeId;
        if (isSplitVal && splitItems.value.length > 0) {
          splitItems.value[0].allocationId = result.recommendedEnvelopeId;
        }
        aiRecommendationText.value = `💡 AI merekomendasikan amplop "${matched.envelopeName}" karena: ${result.analysisReasoning || "Kecocokan transaksi"}`;
      } else {
        if (allocations.length > 0) {
          form.allocationId = allocations[0].id;
          if (isSplitVal && splitItems.value.length > 0) {
            splitItems.value[0].allocationId = allocations[0].id;
          }
        }
        aiRecommendationText.value = `⚠️ Kategori yang direkomendasikan AI tidak aktif. Dialihkan ke amplop "${allocations[0]?.envelopeName || "lain"}" yang aktif.`;
      }
    } else {
      if (allocations.length > 0) {
        form.allocationId = allocations[0].id;
      }
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
    splitItems: Ref<Array<{ allocationId: string; amount: number | ""; note?: string }>>,
    aiRecommendationText: Ref<string>,
    alertCallback: (msg: string, title: string) => void
  ) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    if (!navigator.onLine) {
      alertCallback(
        "Pemrosesan foto struk memerlukan koneksi internet. Foto Anda tersimpan aman di galeri. Silakan catat nominalnya secara manual saat ini.",
        "Offline"
      );
      target.value = "";
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alertCallback(
        "Format file tidak didukung. Silakan gunakan tangkapan layar (screenshot) bukti transfer Anda berupa file JPG/PNG/WEBP.",
        "File Tidak Didukung"
      );
      target.value = "";
      return;
    }

    const sessionId = ++currentOcrSessionId.value;
    ocrStatus.value = "🔄 Mengirim gambar...";
    aiRecommendationText.value = "";
    ocrConfidence.value = "";
    ocrHighlightedFields.value = { amount: false, merchant: false, date: false };

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
      ocrStatus.value =
        "❌ Kami gagal membaca struk secara otomatis. Silakan isi pengeluaran secara manual di bawah ini.";
      form.note = form.note
        ? `${form.note} (Struk: ${file.name})`
        : `Pencatatan manual dari struk: ${file.name}`;
      ocrConfidence.value = "";
      ocrHighlightedFields.value = { amount: false, merchant: false, date: false };
      console.error("Kesalahan OCR:", err);
    }
  };

  return {
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
  };
}
