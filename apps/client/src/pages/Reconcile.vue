<template>
  <f7-page name="reconcile" @page:beforein="loadReconcileData">
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
      <f7-nav-title class="font-headline">Rekonsiliasi Saldo Mingguan</f7-nav-title>
    </f7-navbar>

    <div v-if="loading" style="text-align: center; padding: 48px">
      <f7-preloader size="42" color="green"></f7-preloader>
      <div style="margin-top: 16px; color: var(--fintr-text-muted)">Memuat kalkulasi saldo...</div>
    </div>

    <div v-else style="padding: 16px">
      <!-- Info Card Component -->
      <ReconcileBalanceCard :reconcile-diff="reconcileDiff" />

      <!-- Snapshot Input Form Component -->
      <ReconcileSnapshotForm
        v-model:form="form"
        v-model:auto-note-enabled="autoNoteEnabled"
        :show-calculator="showCalculator"
        :wallets="wallets"
        :calculator-total="calculatorTotal"
        :computed-diff="computedDiff"
        :submitting="submitting"
        @toggle-calculator="toggleCalculator"
        @add-wallet="addWallet"
        @remove-wallet="removeWallet"
        @sync-calculator="syncCalculator"
        @handle-actual-balance-input="handleActualBalanceInput"
        @submit-snapshot="submitSnapshot"
      />

      <!-- Snapshot History List Component -->
      <ReconcileHistoryList
        :history-list="historyList"
        :expanded-snapshots="expandedSnapshots"
        :parse-note-details="parseNoteDetails"
        :format-date="formatDate"
        @toggle-expand-snapshot="toggleExpandSnapshot"
      />
    </div>
  </f7-page>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from "vue";
import { f7Page, f7Navbar, f7Preloader, f7, f7NavLeft, f7Link, f7NavTitle } from "framework7-vue";
import { useBackButton } from "../composables/useBackButton";
import { useReconcile } from "../composables/useReconcile";

// Subcomponents
import ReconcileBalanceCard from "../components/reconcile/ReconcileBalanceCard.vue";
import ReconcileSnapshotForm from "../components/reconcile/ReconcileSnapshotForm.vue";
import ReconcileHistoryList from "../components/reconcile/ReconcileHistoryList.vue";

const props = defineProps<{
  f7router: any;
}>();

const goBack = () => {
  props.f7router.back();
};

const {
  loading,
  submitting,
  reconcileDiff,
  historyList,
  computedDiff,
  form,
  showCalculator,
  wallets,
  autoNoteEnabled,
  calculatorTotal,
  expandedSnapshots,
  toggleCalculator,
  addWallet,
  removeWallet,
  syncCalculator,
  handleActualBalanceInput,
  toggleExpandSnapshot,
  parseNoteDetails,
  loadReconcileData,
  submitSnapshot,
  formatDate,
  isDirty,
  handleNavbarBack,
} = useReconcile(props.f7router);

// Hardware back button integration
const { registerHandler } = useBackButton();
let unregisterBack: (() => void) | null = null;

onMounted(() => {
  unregisterBack = registerHandler(10, () => {
    if (isDirty()) {
      f7.dialog.confirm(
        "Ada perubahan belum disimpan. Batalkan rekonsiliasi?",
        "Batal Rekonsiliasi?",
        () => {
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
  if (unregisterBack) {
    unregisterBack();
  }
});
</script>
