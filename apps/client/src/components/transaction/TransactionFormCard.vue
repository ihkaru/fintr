<template>
  <div
    style="
      background: #ffffff;
      border: 1px solid #bfc9c1;
      border-radius: 20px;
      padding: 20px;
      margin-bottom: 24px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
      display: flex;
      flex-direction: column;
      gap: 16px;
    "
  >
    <!-- Merchant / Nama Toko -->
    <div>
      <div
        style="
          font-size: 12px;
          color: var(--fintr-text-muted);
          margin-bottom: 6px;
          font-weight: 600;
        "
      >
        Merchant / Nama Toko
      </div>
      <input
        type="text"
        :value="merchant"
        @input="emit('update:merchant', ($event.target as HTMLInputElement).value)"
        placeholder="Indomaret, SPBU Mempawah, BRI ATM, dll"
        style="
          background: #f3f1e9;
          border: 1px solid #bfc9c1;
          color: #161a32;
          padding: 12px;
          border-radius: 10px;
          width: 100%;
          box-sizing: border-box;
          font-size: 14px;
        "
      />
    </div>

    <!-- Waktu Transaksi -->
    <div>
      <div
        style="
          font-size: 12px;
          color: var(--fintr-text-muted);
          margin-bottom: 6px;
          font-weight: 600;
        "
      >
        Waktu Transaksi
      </div>
      <input
        type="datetime-local"
        :value="date"
        @input="emit('update:date', ($event.target as HTMLInputElement).value)"
        style="
          background: #f3f1e9;
          border: 1px solid #bfc9c1;
          color: #161a32;
          padding: 12px;
          border-radius: 10px;
          width: 100%;
          box-sizing: border-box;
          font-size: 14px;
          font-family: inherit;
        "
      />
    </div>

    <!-- Catatan Belanja -->
    <div>
      <div
        style="
          font-size: 12px;
          color: var(--fintr-text-muted);
          margin-bottom: 6px;
          font-weight: 600;
        "
      >
        Catatan Belanja
      </div>
      <textarea
        :value="note"
        @input="emit('update:note', ($event.target as HTMLTextAreaElement).value)"
        placeholder="Tulis keterangan belanja..."
        rows="5"
        style="
          background: #f3f1e9;
          border: 1px solid #bfc9c1;
          color: #161a32;
          padding: 12px;
          border-radius: 10px;
          width: 100%;
          box-sizing: border-box;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
        "
      ></textarea>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  merchant: string;
  date: string;
  note: string;
}>();

const emit = defineEmits<{
  (e: "update:merchant", val: string): void;
  (e: "update:date", val: string): void;
  (e: "update:note", val: string): void;
}>();
</script>
