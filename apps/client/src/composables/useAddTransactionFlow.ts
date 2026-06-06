import { ref, reactive, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import { f7 } from "framework7-vue";
import { envelopes } from "../js/api";
import { useBackButton } from "./useBackButton";

export function useAddTransactionFlow(
  form: any,
  ocrStatus: any,
  ocrConfidence: any,
  allocations: any,
  isSplit: any,
  splitItems: any,
  loadEnvelopes: (alertCallback: any) => Promise<void>,
  goBack: () => void
) {
  // New Envelope Sheet State
  const newEnvelopeOpened = ref(false);
  const creatingEnvelope = ref(false);

  const colorPresets = [
    "#6366f1",
    "#ec4899",
    "#10b981",
    "#f59e0b",
    "#06b6d4",
    "#8b5cf6",
    "#ef4444",
    "#14b8a6",
  ];

  const newEnvelopeForm = reactive({
    name: "",
    defaultAmount: "" as number | "",
    color: colorPresets[0],
    rolloverBehavior: "reset" as "reset" | "rollover_self" | "rollover_to_savings",
  });

  const openCreateEnvelopeSheet = () => {
    newEnvelopeForm.name = "";
    newEnvelopeForm.defaultAmount = "";
    newEnvelopeForm.color = colorPresets[0];
    newEnvelopeForm.rolloverBehavior = "reset";
    newEnvelopeOpened.value = true;
  };

  const showAlert = (msg: string, title: string) => {
    f7.dialog.alert(msg, title);
  };

  const handleCreateEnvelope = async () => {
    if (!newEnvelopeForm.name.trim()) {
      f7.dialog.alert("Masukkan nama amplop", "Oops");
      return;
    }
    creatingEnvelope.value = true;
    try {
      const newEnv = await envelopes.create({
        name: newEnvelopeForm.name.trim(),
        defaultAmount: Number(newEnvelopeForm.defaultAmount || 0),
        color: newEnvelopeForm.color,
        rolloverBehavior: newEnvelopeForm.rolloverBehavior,
      });
      f7.toast
        .create({
          text: "Amplop baru dibuat! ✉️",
          closeTimeout: 2000,
        })
        .open();
      newEnvelopeOpened.value = false;

      await loadEnvelopes(showAlert);
      if (newEnv && newEnv.id) {
        const found = allocations.value.find((a: any) => a.templateId === newEnv.id);
        if (found) {
          form.allocationId = found.id;
          if (isSplit.value && splitItems.value.length > 0) {
            splitItems.value[0].allocationId = found.id;
          }
        }
      }
    } catch (err: any) {
      f7.dialog.alert("Gagal membuat amplop: " + err.message, "Gagal");
    } finally {
      creatingEnvelope.value = false;
    }
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
      f7.dialog.confirm(
        "Ada transaksi belum tersimpan. Batalkan pencatatan?",
        "Batal Catat?",
        () => {
          goBack();
        }
      );
    } else {
      goBack();
    }
  };

  const { registerHandler } = useBackButton();
  let unregisterBack: (() => void) | null = null;

  const handleEnvelopeChanged = async () => {
    await loadEnvelopes(showAlert);
  };

  // Watcher for OCR confidence/focus
  watch(
    () => ocrConfidence.value,
    newConf => {
      if (newConf) {
        if (newConf === "low" || form.amount === "") {
          nextTick(() => {
            const input = document.querySelector(".amount-input") as HTMLInputElement;
            if (input) {
              input.focus();
              if (typeof form.amount === "number") {
                input.select();
              }
            }
          });
        }
      }
    }
  );

  onMounted(() => {
    window.addEventListener("fintr:envelope-changed", handleEnvelopeChanged);

    unregisterBack = registerHandler(10, () => {
      if (isDirty()) {
        f7.dialog.confirm(
          "Ada transaksi belum tersimpan. Batalkan pencatatan?",
          "Batal Catat?",
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
    window.removeEventListener("fintr:envelope-changed", handleEnvelopeChanged);
    if (unregisterBack) {
      unregisterBack();
    }
  });

  return {
    newEnvelopeOpened,
    creatingEnvelope,
    newEnvelopeForm,
    colorPresets,
    openCreateEnvelopeSheet,
    handleCreateEnvelope,
    isDirty,
    handleNavbarBack,
    showAlert,
  };
}
