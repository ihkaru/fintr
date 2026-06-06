<template>
  <div
    class="animate-in"
    style="
      background: #fdfdfb;
      border: 1px solid #bfc9c1;
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 16px;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
    "
  >
    <div
      style="
        font-size: 12px;
        font-weight: 700;
        color: #0f5238;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        gap: 4px;
      "
    >
      <span class="material-symbols-outlined" style="font-size: 16px">account_balance_wallet</span>
      Pecah Saldo per Rekening / Dompet
    </div>

    <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px">
      <div
        v-for="(wallet, idx) in wallets"
        :key="idx"
        style="
          background: #f8faf9;
          border: 1px solid #dde4de;
          border-radius: 10px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        "
      >
        <!-- Baris 1: Label nama dompet -->
        <input
          type="text"
          class="wallet-label-input"
          v-model="wallet.label"
          placeholder="Nama Dompet (e.g. BRI, Dompet Tunai)"
          @input="$emit('sync-calculator')"
        />
        <!-- Baris 2: Input jumlah + tombol hapus -->
        <div style="display: flex; gap: 8px; align-items: center; width: 100%">
          <div class="wallet-amount-box">
            <span class="wallet-rp-prefix">Rp</span>
            <input
              type="number"
              class="wallet-amount-inner"
              v-model="wallet.amount"
              placeholder="0"
              @input="$emit('sync-calculator')"
            />
          </div>
          <a
            @click="$emit('remove-wallet', idx)"
            style="
              background: #fff0f0;
              border: 1px solid #f5c6c6;
              color: var(--fintr-danger);
              cursor: pointer;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
              width: 38px;
              height: 38px;
              box-sizing: border-box;
            "
          >
            <span class="material-symbols-outlined" style="font-size: 18px">delete</span>
          </a>
        </div>
      </div>
    </div>

    <div
      style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px"
    >
      <button
        type="button"
        @click="$emit('add-wallet')"
        style="
          background: #e8ede9;
          border: none;
          color: #0f5238;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
        "
      >
        <span class="material-symbols-outlined" style="font-size: 14px">add</span>
        Tambah Baris
      </button>

      <div style="font-size: 12px; font-weight: 700; color: #161a32">
        Total: {{ formatRp(calculatorTotal) }}
      </div>
    </div>

    <!-- Auto-copy note option -->
    <div
      style="
        margin-top: 14px;
        padding-top: 10px;
        border-top: 1px dashed #bfc9c1;
        display: flex;
        align-items: center;
        gap: 8px;
      "
    >
      <input
        type="checkbox"
        id="autoNoteCheckbox"
        :checked="autoNoteEnabled"
        @change="handleCheckboxChange"
        style="accent-color: #0f5238; cursor: pointer"
      />
      <label
        for="autoNoteCheckbox"
        style="font-size: 11px; color: #707973; font-weight: 600; cursor: pointer"
      >
        Simpan rincian ini ke Catatan Snapshot
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatRp } from "../../js/routes";

defineProps<{
  wallets: Array<{ label: string; amount: number | "" }>;
  calculatorTotal: number;
  autoNoteEnabled: boolean;
}>();

const emit = defineEmits<{
  (e: "add-wallet"): void;
  (e: "remove-wallet", index: number): void;
  (e: "sync-calculator"): void;
  (e: "update:autoNoteEnabled", value: boolean): void;
}>();

const handleCheckboxChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit("update:autoNoteEnabled", target.checked);
};
</script>

<style scoped>
/* ── Wallet Amount Box ─────────────────────────────────────── */
.wallet-amount-box {
  display: flex;
  align-items: center;
  flex: 1;
  background: #ffffff;
  border: 1px solid #bfc9c1;
  border-radius: 8px;
  overflow: hidden;
  min-width: 0;
  height: 38px;
  box-sizing: border-box;
}

.wallet-rp-prefix {
  padding: 0 10px;
  font-size: 13px;
  font-weight: 700;
  color: #707973;
  white-space: nowrap;
  flex-shrink: 0;
  user-select: none;
  display: flex;
  align-items: center;
  height: 100%;
}

/* input inside .wallet-amount-box */
.wallet-amount-inner {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  outline: none;
  height: 100%;
  padding: 0 10px 0 0;
  color: #0f5238;
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  box-sizing: border-box;
  -moz-appearance: textfield;
  width: 100%;
}

.wallet-amount-inner::-webkit-outer-spin-button,
.wallet-amount-inner::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.wallet-amount-inner::placeholder {
  color: #b0b8b3;
  font-weight: 400;
}

.wallet-amount-box:focus-within {
  border-color: #0f5238;
  box-shadow: 0 0 0 2px rgba(15, 82, 56, 0.1);
}

/* ── Wallet Label Input ─────────────────────────────────────── */
.wallet-label-input {
  display: block;
  width: 100%;
  background: #ffffff;
  border: 1px solid #bfc9c1;
  border-radius: 8px;
  height: 38px;
  padding: 0 12px;
  color: #161a32;
  font-size: 13px;
  font-family: inherit;
  box-sizing: border-box;
  outline: none;
}

.wallet-label-input:focus {
  border-color: #0f5238;
  box-shadow: 0 0 0 2px rgba(15, 82, 56, 0.1);
}
</style>
