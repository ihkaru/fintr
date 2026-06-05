import { onMounted, onBeforeUnmount } from "vue";
import { f7, f7ready } from "framework7-vue";
import { useBackButton } from "./useBackButton";
import { useSync } from "./useSync";
import { isLoggedInReactive, auth, setToken, setUser } from "../js/api";
import { Capacitor } from "@capacitor/core";
import { CapacitorShareTarget } from "@capgo/capacitor-share-target";
import { Filesystem } from "@capacitor/filesystem";
import { useShareStore } from "../js/shareStore";

let lastTimeBackButtonWasPressed = 0;

export function useHardwareBack() {
  const { handlers } = useBackButton();
  const { startSync, stopSync } = useSync();

  onMounted(() => {
    f7ready(async () => {
      const cap = (window as any).Capacitor;
      if (!cap) return;

      const AppPlugin = cap.Plugins?.App;
      if (!AppPlugin) return;

      // Register Capacitor Back Button Listener
      await AppPlugin.addListener("backButton", async () => {
        const $ = f7.$;

        // 1. Close Open overlays (Action sheet, Dialog, Sheet, Popup, Popover, Panels)
        if ($(".actions-modal.modal-in").length) {
          f7.actions.close(".actions-modal.modal-in");
          return;
        }
        if ($(".dialog.modal-in").length) {
          f7.dialog.close(".dialog.modal-in");
          return;
        }
        if ($(".sheet-modal.modal-in").length) {
          f7.sheet.close(".sheet-modal.modal-in");
          return;
        }
        if ($(".popover.modal-in").length) {
          f7.popover.close(".popover.modal-in");
          return;
        }
        if ($(".popup.modal-in").length) {
          f7.popup.close(".popup.modal-in");
          return;
        }
        if ($(".panel-left.panel-in, .panel-right.panel-in").length) {
          f7.panel.close();
          return;
        }

        // 2. Custom page-level handlers (e.g. dirty checks)
        for (const registered of handlers.value) {
          const wasHandled = await registered.handler();
          if (wasHandled) {
            // Handled by custom logic (e.g. confirm exit dialog shown)
            return;
          }
        }

        // 3. Router navigation (Framework7 Router pop)
        const activeView = f7.views.current;
        const router = activeView?.router;

        if (router && router.history.length > 1) {
          router.back();
        }
        // 4. Double tap to exit if at root page
        else {
          const currentTime = new Date().getTime();
          const timeDiff = currentTime - lastTimeBackButtonWasPressed;

          if (timeDiff < 2000) {
            AppPlugin.exitApp();
          } else {
            lastTimeBackButtonWasPressed = currentTime;
            f7.toast
              .create({
                text: "Tekan kembali sekali lagi untuk keluar",
                position: "bottom",
                closeTimeout: 2000,
              })
              .open();
          }
        }
      });

      // Register App State Lifecycle Listener (Pause/Resume SSE)
      await AppPlugin.addListener("appStateChange", ({ isActive }: { isActive: boolean }) => {
        console.log(`[Lifecycle] App state changed, isActive: ${isActive}`);
        if (isActive) {
          if (isLoggedInReactive.value) {
            console.log("[Lifecycle] Resuming real-time sync...");
            startSync();
          }
        } else {
          console.log("[Lifecycle] Pausing real-time sync (App backgrounded)...");
          stopSync();
        }
      });

      // Register Custom URL Scheme Deep Link Listener
      await AppPlugin.addListener("appUrlOpen", async (data: { url: string }) => {
        console.log("[DeepLink] App opened with URL:", data.url);
        if (data.url.includes("id_token=")) {
          const cleanUrl = data.url.replace("com.fintr.famivault://", "http://localhost/");
          try {
            const urlObj = new URL(cleanUrl);
            const idToken = urlObj.searchParams.get("id_token");
            if (idToken) {
              console.log("[DeepLink] Found Google id_token from redirect");
              f7.dialog.preloader("Menghubungkan Akun...");

              const res = await auth.loginWithGoogle(idToken);
              setToken(res.token);
              setUser(res.user);

              f7.dialog.close();

              if (f7.views.main && f7.views.main.router) {
                f7.views.main.router.navigate("/", { reloadAll: true });
              }
            }
          } catch (err: any) {
            f7.dialog.close();
            f7.dialog.alert("Gagal masuk dengan Google: " + err.message, "Error");
          }
        }
      });
    });
  });

  onBeforeUnmount(() => {
    const cap = (window as any).Capacitor;
    if (cap && cap.Plugins?.App) {
      cap.Plugins.App.removeAllListeners();
    }
  });
}
