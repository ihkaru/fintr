<template>
  <div
    style="
      background: #ffffff;
      border: 1px solid #bfc9c1;
      border-radius: 20px;
      padding: 24px 16px;
      text-align: center;
      margin-bottom: 20px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
    "
  >
    <div
      style="
        font-size: 12px;
        color: var(--fintr-text-muted);
        margin-bottom: 8px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      "
    >
      Jumlah Pengeluaran (Rp)
    </div>
    <div style="display: flex; align-items: center; justify-content: center; gap: 8px">
      <span class="font-headline" style="font-size: 28px; font-weight: 800; color: #0f5238"
        >Rp</span
      >
      <input
        type="number"
        class="amount-input font-headline"
        :value="modelValue"
        @input="onInput"
        placeholder="0"
        inputmode="numeric"
        style="
          font-size: 36px;
          font-weight: 800;
          color: #0f5238;
          border: none;
          background: transparent;
          width: 80%;
          text-align: left;
          outline: none;
          margin: 0;
          padding: 0;
        "
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: number | "";
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: number | ""): void;
}>();

const onInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const val = target.value === "" ? "" : Number(target.value);
  emit("update:modelValue", val);
};
</script>
