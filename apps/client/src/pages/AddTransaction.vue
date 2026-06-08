<template>
  <f7-page name="add-transaction" class="page-add-transaction">
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

    <!-- Amount Input Card -->
    <AmountInputCard
      v-model="form.amount"
      :highlight="ocrHighlightedFields.amount"
      @clear-highlight="clearFieldHighlight()"
    />

    <!-- Source Toggle -->
    <SourceToggle :model-value="form.source" @update:model-value="setSource" />

    <!-- OCR Upload Area -->
    <OcrUploadArea
      v-show="form.source === 'ocr'"
      :ocr-status="ocrStatus"
      :local-image-preview-url="localImagePreviewUrl"
      :confidence="ocrConfidence"
      @file-change="handleOcrFile"
      @clear-file="clearReceipt"
    />

    <!-- Quick Split Auto-Link Banner -->
    <div
      v-if="ocrItems && ocrItems.length > 0"
      @click="handleAutoSplit"
      class="animate-in"
      style="
        margin: -12px 0 20px 0;
        padding: 12px 16px;
        background: linear-gradient(135deg, rgba(15, 82, 56, 0.1), rgba(15, 82, 56, 0.05));
        border: 1px dashed rgba(15, 82, 56, 0.3);
        border-radius: 12px;
        color: #0f5238;
        font-size: 13px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        transition:
          transform 0.2s,
          background-color 0.2s;
      "
      onmouseover="this.style.transform = 'translateY(-1px)'"
      onmouseout="this.style.transform = 'none'"
    >
      <span class="material-symbols-outlined" style="font-size: 20px; color: #0f5238">
        splitscreen
      </span>
      <div style="flex: 1">
        Terdeteksi <strong>{{ ocrItems.length }} item</strong> dalam struk ini. Klik di sini untuk
        membagi kategori secara otomatis.
      </div>
      <span class="material-symbols-outlined" style="font-size: 16px; color: #0f5238">
        chevron_right
      </span>
    </div>

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
            flex-wrap: wrap;
            gap: 8px;
          "
        >
          <span
            style="
              font-size: 12px;
              color: var(--fintr-text-muted);
              font-weight: 600;
              display: inline-flex;
              align-items: center;
              gap: 6px;
            "
          >
            Alokasi Pengeluaran
            <span
              v-if="form.source === 'ocr' && ocrConfidence === 'low'"
              style="
                display: inline-flex;
                align-items: center;
                gap: 4px;
                background: #fff8e1;
                border: 1px solid #ffe082;
                color: #b78103;
                padding: 2px 8px;
                border-radius: 999px;
                font-size: 10px;
                font-weight: 700;
                line-height: 1;
              "
            >
              ⚠️ Amplop Belum Yakin
            </span>
          </span>
          <div style="display: flex; gap: 12px; align-items: center">
            <span
              @click="openCreateEnvelopeSheet"
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
              ➕ Buat Amplop Baru
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
        </div>

        <div v-if="loadingEnvelopes" style="padding: 12px 0; text-align: center">
          <f7-preloader size="20" color="green"></f7-preloader>
        </div>

        <div v-else-if="!isSplit">
          <EnvelopeSelector
            :allocations="allocations"
            v-model="form.allocationId"
            :amount="form.amount"
            :ai-recommendation-text="aiRecommendationText"
            :filter-sufficient="filterSufficientOnly"
            @clear-filter="filterSufficientOnly = false"
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
      :highlight-merchant="ocrHighlightedFields.merchant"
      :highlight-date="ocrHighlightedFields.date"
      @clear-highlight="clearFieldHighlight"
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
        {{
          submitting
            ? "Menyimpan..."
            : form.source === "ocr" && (ocrConfidence === "low" || form.amount === "")
              ? "Tinjau & Simpan Transaksi"
              : "Simpan Transaksi"
        }}
      </button>
    </div>

    <!-- Create Envelope Sheet -->
    <NewEnvelopeSheet
      v-model:opened="newEnvelopeOpened"
      :creating-envelope="creatingEnvelope"
      :new-envelope-form="newEnvelopeForm"
      :color-presets="colorPresets"
      @update-form="Object.assign(newEnvelopeForm, $event)"
      @submit="handleCreateEnvelope"
    />
  </f7-page>
</template>

<script setup lang="ts">
import { f7Page, f7Navbar, f7Preloader, f7NavLeft, f7Link, f7NavTitle } from "framework7-vue";
import { useAddTransaction } from "../composables/useAddTransaction";
import { useAddTransactionFlow } from "../composables/useAddTransactionFlow";

import AmountInputCard from "../components/transaction/AmountInputCard.vue";
import SourceToggle from "../components/transaction/SourceToggle.vue";
import OcrUploadArea from "../components/transaction/OcrUploadArea.vue";
import EnvelopeSelector from "../components/transaction/EnvelopeSelector.vue";
import SplitEditor from "../components/transaction/SplitEditor.vue";
import TransactionFormCard from "../components/transaction/TransactionFormCard.vue";
import NewEnvelopeSheet from "../components/transaction/NewEnvelopeSheet.vue";

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
  ocrConfidence,
  ocrHighlightedFields,
  ocrItems,
  filterSufficientOnly,
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

const goBack = () => {
  props.f7router.back();
};

const {
  newEnvelopeOpened,
  creatingEnvelope,
  newEnvelopeForm,
  colorPresets,
  openCreateEnvelopeSheet,
  handleCreateEnvelope,
  handleNavbarBack,
  showAlert,
} = useAddTransactionFlow(
  form,
  ocrStatus,
  ocrConfidence,
  allocations,
  isSplit,
  splitItems,
  loadEnvelopes,
  goBack
);

const handleOcrFile = (e: Event) => {
  onOcrFileChange(e, showAlert);
};

const handleAutoSplit = () => {
  if (ocrItems.value && ocrItems.value.length > 0) {
    isSplit.value = true;
    splitItems.value = ocrItems.value.map(item => {
      const matched = allocations.value.find(
        (a: any) =>
          a.id === item.recommendedEnvelopeId ||
          a.envelopeName.toLowerCase() === item.name?.toLowerCase()
      );
      return {
        allocationId: matched ? matched.id : allocations.value[0]?.id || "",
        amount: item.total || item.price || 0,
        note: item.name || "",
      };
    });
  }
};

const clearFieldHighlight = (field?: "amount" | "merchant" | "date") => {
  if (!field) {
    ocrHighlightedFields.value.amount = false;
  } else {
    ocrHighlightedFields.value[field] = false;
  }
};

const handleUpdateSplitItem = ({
  index,
  field,
  value,
}: {
  index: number;
  field: "allocationId" | "amount" | "note";
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
</script>
