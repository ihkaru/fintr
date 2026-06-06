<template>
  <f7-page name="add-transaction">
    <f7-navbar>
      <f7-nav-left>
        <f7-link
          icon-only
          @click="handleNavbarBack"
          style="display: flex; align-items: center; gap: 4px; color: var(--fintr-primary)"
        >
          <span class="material-symbols-outlined" style="font-size: 24px">arrow_back</span>
          <span class="if-not-md" style="font-size: 16px; font-weight: 600">Kembali</span>
        </f7-link>
      </f7-nav-left>
      <f7-nav-title class="font-headline">Catat Pengeluaran</f7-nav-title>
    </f7-navbar>

    <div
      class="page-content"
      style="padding: 24px 16px; background: #faf3e0; min-height: 100vh; box-sizing: border-box"
    >
      <!-- Amount Input Card -->
      <AmountInputCard v-model="form.amount" />

      <!-- Source Toggle -->
      <SourceToggle :model-value="form.source" @update:model-value="setSource" />

      <!-- OCR Upload Area -->
      <OcrUploadArea
        v-show="form.source === 'ocr'"
        :ocr-status="ocrStatus"
        :local-image-preview-url="localImagePreviewUrl"
        @file-change="handleOcrFile"
        @clear-file="clearReceipt"
      />

      <!-- Form Details Card -->
      <div
        style="
          background: #ffffff;
          border: 1px solid #bfc9c1;
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
        "
      >
        <!-- Envelope Selector Section (Single vs Split) -->
        <div style="margin-bottom: 16px">
          <div
            style="
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 8px;
            "
          >
            <span style="font-size: 12px; color: var(--fintr-text-muted); font-weight: 600">
              Alokasi Pengeluaran
            </span>
            <span
              @click="onToggleSplit"
              style="
                font-size: 12px;
                color: #0f5238;
                font-weight: 700;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 4px;
              "
            >
              {{ isSplit ? "✍️ Mode Tunggal" : "🥞 Bagi Kategori (Split)" }}
            </span>
          </div>

          <div v-if="loadingEnvelopes" style="padding: 12px 0; text-align: center">
            <f7-preloader size="20" color="green"></f7-preloader>
          </div>

          <div v-else-if="!isSplit">
            <EnvelopeSelector
              :allocations="allocations"
              v-model="form.allocationId"
              :ai-recommendation-text="aiRecommendationText"
            />
          </div>

          <!-- Split Items Section -->
          <div v-else class="animate-in" style="margin-top: 8px">
            <SplitEditor
              :split-items="splitItems"
              :allocations="allocations"
              :is-split-balanced="splitRemaining === 0"
              :split-diff="splitRemaining"
              @update-item="handleUpdateSplitItem"
              @add-item="onAddSplitItem"
              @remove-item="handleRemoveSplitItem"
            />

            <!-- AI Recommendation Text inside split mode -->
            <div
              v-if="aiRecommendationText"
              class="animate-in"
              style="
                margin-top: 8px;
                margin-bottom: 12px;
                padding: 10px 12px;
                background: rgba(15, 82, 56, 0.08);
                border-left: 3px solid #0f5238;
                border-radius: 6px;
                font-size: 12px;
                color: #0f5238;
                line-height: 1.4;
                font-weight: 600;
              "
            >
              {{ aiRecommendationText }}
            </div>
          </div>
        </div>
      </div>

      <!-- Transaction Fields: Merchant, Date, Note -->
      <TransactionFormCard
        v-model:merchant="form.merchant"
        v-model:date="form.date"
        v-model:note="form.note"
      />

      <!-- Actions Button -->
      <div style="display: flex; gap: 12px; margin-top: 24px">
        <button
          class="btn-secondary"
          @click="handleReset"
          style="
            flex: 1;
            background: #bfc9c1;
            color: #161a32;
            border: none;
            padding: 14px;
            border-radius: 12px;
            font-weight: 700;
            font-size: 15px;
            cursor: pointer;
            transition: all 0.2s;
          "
          v-if="form.amount || form.merchant || form.note || ocrStatus"
        >
          Reset Form
        </button>
        <button
          class="btn-primary font-headline"
          :disabled="submitting"
          @click="handleSave"
          style="
            flex: 2;
            border: none;
            padding: 14px;
            border-radius: 12px;
            font-weight: 700;
            font-size: 15px;
            cursor: pointer;
          "
        >
          {{ submitting ? "Menyimpan..." : "Simpan Transaksi" }}
        </button>
      </div>
    </div>
  </f7-page>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from "vue";
import { f7Page, f7Navbar, f7Preloader, f7, f7NavLeft, f7Link, f7NavTitle } from "framework7-vue";
import { useAddTransaction } from "../composables/useAddTransaction";
import { useBackButton } from "../composables/useBackButton";

import AmountInputCard from "../components/transaction/AmountInputCard.vue";
import SourceToggle from "../components/transaction/SourceToggle.vue";
import OcrUploadArea from "../components/transaction/OcrUploadArea.vue";
import EnvelopeSelector from "../components/transaction/EnvelopeSelector.vue";
import SplitEditor from "../components/transaction/SplitEditor.vue";
import TransactionFormCard from "../components/transaction/TransactionFormCard.vue";

const props = defineProps<{
  f7route: any;
  f7router: any;
}>();

const {
  loadingEnvelopes,
  submitting,
  allocations,
  aiRecommendationText,
  form,
  isSplit,
  splitItems,
  splitRemaining,
  ocrStatus,
  setSource,
  loadEnvelopes,
  saveTransaction,
  onOcrFileChange,
  onToggleSplit,
  onAddSplitItem,
  onRemoveSplitItem,
  resetForm,
  localImagePreviewUrl,
  clearReceipt,
} = useAddTransaction(props.f7route.query.allocationId as string);

const showAlert = (msg: string, title: string) => {
  f7.dialog.alert(msg, title);
};

const goBack = () => {
  props.f7router.back();
};

const handleOcrFile = (e: Event) => {
  onOcrFileChange(e, showAlert);
};

const handleUpdateSplitItem = ({
  index,
  field,
  value,
}: {
  index: number;
  field: "allocationId" | "amount";
  value: any;
}) => {
  splitItems.value[index][field] = value;
};

const handleRemoveSplitItem = (index: number) => {
  onRemoveSplitItem(index, showAlert);
};

const handleReset = () => {
  resetForm("ocr-file-input");
};

const handleSave = () => {
  saveTransaction(showAlert, goBack);
};

const isDirty = () => {
  return (
    form.amount !== "" ||
    form.merchant !== "" ||
    form.note !== "" ||
    ocrStatus.value === "processing" ||
    ocrStatus.value === "success"
  );
};

const handleNavbarBack = () => {
  if (isDirty()) {
    f7.dialog.confirm("Ada transaksi belum tersimpan. Batalkan pencatatan?", "Batal Catat?", () => {
      goBack();
    });
  } else {
    goBack();
  }
};

const { registerHandler } = useBackButton();
let unregisterBack: (() => void) | null = null;

const handleEnvelopeChanged = async () => {
  await loadEnvelopes(showAlert);
};

onMounted(async () => {
  await loadEnvelopes(showAlert);
  window.addEventListener("fintr:envelope-changed", handleEnvelopeChanged);

  unregisterBack = registerHandler(10, () => {
    if (isDirty()) {
      f7.dialog.confirm(
        "Ada transaksi belum tersimpan. Batalkan pencatatan?",
        "Batal Catat?",
        () => {
          // Unregister temporarily to allow propagation to pop the route
          if (unregisterBack) unregisterBack();
          goBack();
        }
      );
      return true; // handled
    }
    return false; // propagate
  });
});

onBeforeUnmount(() => {
  window.removeEventListener("fintr:envelope-changed", handleEnvelopeChanged);
  if (unregisterBack) {
    unregisterBack();
  }
});
</script>
