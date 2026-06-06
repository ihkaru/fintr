<template>
  <div
    class="animate-in"
    style="
      background: #ffffff;
      border: 1px solid #bfc9c1;
      border-radius: 20px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
    "
  >
    <div
      class="font-headline"
      style="font-size: 16px; font-weight: 800; color: #161a32; margin-bottom: 16px"
    >
      Ambil Snapshot Saldo Aktual
    </div>

    <div style="margin-bottom: 16px">
      <div
        style="
          font-size: 12px;
          color: var(--fintr-text-muted);
          margin-bottom: 8px;
          font-weight: 600;
        "
      >
        Saldo Riil / Fisik Saat Ini (Total Semua Rekening &amp; Dompet)
      </div>
      <input
        type="number"
        class="fintr-input"
        :value="form.actualBalance"
        @input="onActualBalanceInput"
        placeholder="Masukkan saldo riil..."
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

    <!-- Tautan kalkulator pecahan dompet -->
    <div style="margin-top: 10px; margin-bottom: 16px">
      <button
        type="button"
        @click="$emit('toggle-calculator')"
        style="
          background: none;
          border: none;
          color: #0f5238;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0;
        "
      >
        <span class="material-symbols-outlined" style="font-size: 18px">
          {{ showCalculator ? "keyboard_arrow_up" : "calculate" }}
        </span>
        {{ showCalculator ? "Sembunyikan Rincian Dompet" : "🧮 Hitung dari Beberapa Dompet" }}
      </button>
    </div>

    <!-- Wallet Calculator Component -->
    <WalletCalculator
      v-if="showCalculator"
      :wallets="wallets"
      :calculator-total="calculatorTotal"
      :auto-note-enabled="autoNoteEnabled"
      @update:auto-note-enabled="$emit('update:autoNoteEnabled', $event)"
      @add-wallet="$emit('add-wallet')"
      @remove-wallet="$emit('remove-wallet', $event)"
      @sync-calculator="$emit('sync-calculator')"
    />

    <!-- Difference & Contextual Guidance Component -->
    <ReconcileDiffIndicator v-if="form.actualBalance !== ''" :computed-diff="computedDiff" />

    <!-- Notes Field -->
    <div style="margin-bottom: 20px">
      <div
        style="
          font-size: 12px;
          color: var(--fintr-text-muted);
          margin-bottom: 8px;
          font-weight: 600;
        "
      >
        Catatan Snapshot
      </div>
      <input
        type="text"
        class="fintr-input"
        :value="form.note"
        @input="onNoteInput"
        placeholder="e.g. Cocok setelah BRImo ditarik ATM"
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

    <button class="btn-primary" :disabled="submitting" @click="$emit('submit-snapshot')">
      {{ submitting ? "Menyimpan..." : "Simpan Snapshot Saldo" }}
    </button>
  </div>
</template>

<script setup lang="ts">
import WalletCalculator from "./WalletCalculator.vue";
import ReconcileDiffIndicator from "./ReconcileDiffIndicator.vue";

const props = defineProps<{
  form: {
    actualBalance: number | "";
    note: string;
  };
  showCalculator: boolean;
  wallets: Array<{ label: string; amount: number | "" }>;
  calculatorTotal: number;
  autoNoteEnabled: boolean;
  computedDiff: number;
  submitting: boolean;
}>();

const emit = defineEmits<{
  (e: "update:form", value: typeof props.form): void;
  (e: "update:autoNoteEnabled", value: boolean): void;
  (e: "toggle-calculator"): void;
  (e: "add-wallet"): void;
  (e: "remove-wallet", index: number): void;
  (e: "sync-calculator"): void;
  (e: "handle-actual-balance-input"): void;
  (e: "submit-snapshot"): void;
}>();

const onActualBalanceInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const val = target.value === "" ? "" : Number(target.value);
  emit("update:form", { ...props.form, actualBalance: val });
  emit("handle-actual-balance-input");
};

const onNoteInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit("update:form", { ...props.form, note: target.value });
};
</script>
