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
          <span style="font-size: 11px; color: #707973; font-weight: 500">
            Struk Belanja Terunggah
          </span>
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

    <!-- OCR Status banner -->
    <div
      v-if="ocrStatus"
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
  </div>
</template>

<script setup lang="ts">
defineProps<{
  ocrStatus: string;
  localImagePreviewUrl: string;
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
</script>
