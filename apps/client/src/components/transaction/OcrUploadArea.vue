<template>
  <div class="animate-in" style="margin-bottom: 20px">
    <div
      style="
        position: relative;
        background: #ffffff;
        border: 2px dashed #0f5238;
        border-radius: 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
        overflow: hidden;
      "
    >
      <!-- Mode 1: Image Preview Available -->
      <div
        v-if="localImagePreviewUrl"
        style="position: relative; width: 100%; display: flex; flex-direction: column"
      >
        <!-- Image Preview Container with Backdrop Blur -->
        <label
          for="ocr-file-input"
          style="
            position: relative;
            height: 220px;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            background: #000000;
          "
        >
          <!-- Blurred backdrop -->
          <div
            :style="{
              backgroundImage: `url(${localImagePreviewUrl})`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(10px) brightness(0.5)',
              transform: 'scale(1.1)',
            }"
          />
          <!-- Foreground image -->
          <img
            :src="localImagePreviewUrl"
            style="
              position: relative;
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
              display: block;
              z-index: 1;
            "
          />

          <!-- Scanner overlay and laser sweep line -->
          <div v-if="isScanning" class="scanner-overlay">
            <div class="scanner-laser-line"></div>
          </div>

          <!-- Overlay to change image -->
          <div
            style="
              position: absolute;
              bottom: 12px;
              left: 50%;
              transform: translateX(-50%);
              background: rgba(22, 26, 50, 0.75);
              backdrop-filter: blur(4px);
              color: #ffffff;
              padding: 6px 12px;
              border-radius: 20px;
              font-size: 11px;
              font-weight: 700;
              display: flex;
              align-items: center;
              gap: 4px;
              z-index: 2;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            "
          >
            <span class="material-symbols-outlined" style="font-size: 14px">photo_camera</span>
            Ganti Foto Struk
          </div>
        </label>

        <!-- Controls under preview -->
        <div
          style="
            padding: 10px 16px;
            background: #fcfcfc;
            border-top: 1px solid #eef2ef;
            display: flex;
            justify-content: space-between;
            align-items: center;
          "
        >
          <div style="display: flex; align-items: center; gap: 8px">
            <span style="font-size: 11px; color: #707973; font-weight: 500">
              Struk Belanja Terunggah
            </span>
            <!-- Confidence Badge -->
            <span
              v-if="confidence"
              :style="{
                fontSize: '10px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '12px',
                textTransform: 'uppercase',
                backgroundColor:
                  confidence === 'high'
                    ? 'rgba(76, 175, 80, 0.15)'
                    : confidence === 'medium'
                      ? 'rgba(255, 152, 0, 0.15)'
                      : 'rgba(244, 67, 54, 0.15)',
                color:
                  confidence === 'high'
                    ? '#2e7d32'
                    : confidence === 'medium'
                      ? '#ef6c00'
                      : '#c62828',
                border: `1px solid ${confidence === 'high' ? '#4caf50' : confidence === 'medium' ? '#ff9800' : '#f44336'}`,
              }"
            >
              {{ confidence === "high" ? "High" : confidence === "medium" ? "Medium" : "Low" }}
            </span>
          </div>
          <button
            type="button"
            @click.prevent.stop="onClearFile"
            style="
              background: none;
              border: none;
              color: #d32f2f;
              font-size: 12px;
              font-weight: 700;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 4px;
              padding: 4px 8px;
              border-radius: 6px;
              transition: background 0.2s;
            "
            onmouseover="this.style.background = 'rgba(211, 47, 47, 0.08)'"
            onmouseout="this.style.background = 'none'"
          >
            <span class="material-symbols-outlined" style="font-size: 16px">delete</span>
            Hapus Struk
          </button>
        </div>
      </div>

      <!-- Mode 2: Empty/Upload State -->
      <label
        v-else
        for="ocr-file-input"
        style="
          display: block;
          padding: 36px 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
        "
      >
        <div style="font-size: 40px; margin-bottom: 12px; animation: pulse 2s infinite">📸</div>
        <div style="font-size: 14px; color: #161a32; font-weight: 700; margin-bottom: 4px">
          Ambil Foto Struk Belanja
        </div>
        <div style="font-size: 11px; color: #707973">
          Pindai struk belanja atau unggah screenshot BRImo
        </div>
      </label>

      <!-- Hidden Input Field -->
      <input
        type="file"
        id="ocr-file-input"
        accept="image/*"
        capture="environment"
        style="display: none"
        @change="onFileChange"
      />
    </div>

    <!-- OCR Status banner (only when finished/idle) -->
    <div
      v-if="ocrStatus && !isScanning"
      style="
        margin-top: 10px;
        padding: 10px;
        background: rgba(15, 82, 56, 0.08);
        border-radius: 8px;
        font-size: 13px;
        color: #0f5238;
        font-weight: 600;
        text-align: center;
      "
    >
      {{ ocrStatus }}
    </div>

    <!-- OCR Step-by-Step Progress Log (Labor Illusion) -->
    <div
      v-if="isScanning && scannerSteps.length > 0"
      class="animate-in"
      style="
        margin-top: 12px;
        padding: 16px;
        background: #ffffff;
        border: 1px solid #bfc9c1;
        border-radius: 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
      "
    >
      <div
        style="
          font-size: 13px;
          font-weight: 700;
          color: #161a32;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        "
      >
        <span class="material-symbols-outlined" style="font-size: 18px; color: #0f5238"
          >analytics</span
        >
        Proses Analisis AI Struk Belanja
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px">
        <div
          v-for="step in scannerSteps"
          :key="step.id"
          class="step-item-animate"
          :style="{
            opacity: step.status === 'pending' ? 0.5 : 1,
            transition: 'opacity 0.3s ease',
          }"
          style="display: flex; align-items: center; gap: 12px"
        >
          <!-- Step Icon/Status indicator -->
          <div
            style="
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 24px;
              height: 24px;
            "
          >
            <span
              v-if="step.status === 'completed'"
              class="material-symbols-outlined"
              style="font-size: 20px; color: #22c55e"
            >
              check_circle
            </span>
            <span
              v-else-if="step.status === 'active'"
              class="material-symbols-outlined animate-spin"
              style="font-size: 20px; color: #0f5238; display: inline-block"
            >
              progress_activity
            </span>
            <span
              v-else-if="step.status === 'failed'"
              class="material-symbols-outlined"
              style="font-size: 20px; color: #ba1a1a"
            >
              cancel
            </span>
            <span v-else class="material-symbols-outlined" style="font-size: 20px; color: #bfc9c1">
              circle
            </span>
          </div>

          <!-- Step Label -->
          <div style="flex: 1; display: flex; flex-direction: column">
            <span
              :style="{
                fontSize: '12px',
                fontWeight: step.status === 'active' ? '700' : '500',
                color:
                  step.status === 'active'
                    ? '#0f5238'
                    : step.status === 'completed'
                      ? '#161a32'
                      : '#707973',
                transition: 'color 0.3s ease',
              }"
            >
              {{ step.label }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  ocrStatus: string;
  localImagePreviewUrl: string;
  confidence?: "high" | "medium" | "low" | "";
}>();

const emit = defineEmits<{
  (e: "file-change", event: Event): void;
  (e: "clear-file"): void;
}>();

const onFileChange = (e: Event) => {
  emit("file-change", e);
};

const onClearFile = () => {
  emit("clear-file");
};

// Check if scanning is in progress
const isScanning = computed(() => {
  return props.ocrStatus && !props.ocrStatus.startsWith("✅") && !props.ocrStatus.startsWith("❌");
});

// Map simple ocrStatus message to step-by-step progress checklist (Labor Illusion)
const scannerSteps = computed(() => {
  const status = props.ocrStatus || "";
  if (!status) return [];

  const isFailed = status.startsWith("❌");
  const isCompleted = status.startsWith("✅");

  const getStepStatus = (stepId: number) => {
    if (isCompleted) return "completed";
    if (isFailed) return "failed";

    // Detect progress step status based on current ocrStatus content
    if (status.includes("Mengambil") || status.includes("share target")) {
      if (stepId === 1) return "active";
      return "pending";
    }
    if (status.includes("Mengirim")) {
      if (stepId < 2) return "completed";
      if (stepId === 2) return "active";
      return "pending";
    }
    if (
      status.includes("antrean") ||
      status.includes("menganalisis") ||
      status.includes("Gemini")
    ) {
      if (stepId < 3) return "completed";
      if (stepId === 3 || stepId === 4) return "active"; // parallel category mapping & OCR parsing
      return "pending";
    }

    // Default/fallback: if status has started, mark previous steps as completed
    if (stepId < 3) return "completed";
    return "active";
  };

  return [
    { id: 1, label: "Mengambil bukti transaksi / struk", status: getStepStatus(1) },
    { id: 2, label: "Mengunggah data struk ke FamiVault Cloud", status: getStepStatus(2) },
    { id: 3, label: "Ekstraksi nominal & merchant via Gemini AI", status: getStepStatus(3) },
    { id: 4, label: "Mencocokkan rekomendasi kategori amplop anggaran", status: getStepStatus(4) },
    { id: 5, label: "Penyelesaian ekstraksi form pengeluaran", status: getStepStatus(5) },
  ];
});
</script>
