import { ref } from "vue";

export interface SharedData {
  type: "image" | "text" | "pdf";
  base64?: string;
  mimeType?: string;
  text?: string;
  name?: string;
}

const sharedData = ref<SharedData | null>(null);

export function useShareStore() {
  const setSharedData = (data: SharedData) => {
    sharedData.value = data;
  };

  const clearSharedData = () => {
    sharedData.value = null;
  };

  return {
    sharedData,
    setSharedData,
    clearSharedData,
  };
}
