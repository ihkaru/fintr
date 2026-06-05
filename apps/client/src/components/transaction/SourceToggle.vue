<template>
  <div style="display: flex; gap: 12px; margin-bottom: 20px">
    <button
      class="chip-button"
      :style="{
        flex: 1,
        textAlign: 'center',
        padding: '12px',
        borderRadius: '12px',
        fontWeight: '700',
        fontSize: '14px',
        border: modelValue === 'manual' ? '2px solid #0f5238' : '1px solid #bfc9c1',
        background: modelValue === 'manual' ? 'rgba(15, 82, 56, 0.08)' : '#ffffff',
        color: modelValue === 'manual' ? '#0f5238' : '#707973',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }"
      @click="emit('update:modelValue', 'manual')"
    >
      ✍️ Manual
    </button>
    <button
      class="chip-button"
      :style="{
        flex: 1,
        textAlign: 'center',
        padding: '12px',
        borderRadius: '12px',
        fontWeight: '700',
        fontSize: '14px',
        border: modelValue === 'ocr' ? '2px solid #0f5238' : '1px solid #bfc9c1',
        background: modelValue === 'ocr' ? 'rgba(15, 82, 56, 0.08)' : '#ffffff',
        color: modelValue === 'ocr' ? '#0f5238' : '#707973',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }"
      @click="emit('update:modelValue', 'ocr')"
    >
      📷 Scan Struk / QRIS
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: "manual" | "ocr";
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: "manual" | "ocr"): void;
}>();
</script>
