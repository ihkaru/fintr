import { ref } from "vue";

export type BackButtonHandler = () => boolean | Promise<boolean>;

export interface RegisteredHandler {
  priority: number;
  handler: BackButtonHandler;
}

const handlers = ref<RegisteredHandler[]>([]);

export function useBackButton() {
  const registerHandler = (priority: number, handler: BackButtonHandler) => {
    const item = { priority, handler };
    handlers.value.push(item);
    handlers.value.sort((a, b) => b.priority - a.priority);

    // Return cleanup function to unregister
    return () => {
      handlers.value = handlers.value.filter(h => h.handler !== handler);
    };
  };

  return {
    registerHandler,
    handlers,
  };
}
