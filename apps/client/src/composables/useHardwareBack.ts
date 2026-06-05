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

      // Register Capacitor Share Target Listener
      if (Capacitor.isNativePlatform()) {
        try {
          await CapacitorShareTarget.addListener("shareReceived", async (event: any) => {
            console.log("[ShareTarget] Received shared data:", JSON.stringify(event));
            const { setSharedData } = useShareStore();

            if (event.files && event.files.length > 0) {
              const file = event.files[0];
              const mime = file.mimeType || "";

              if (mime.startsWith("image/") || mime === "application/pdf") {
                f7.dialog.preloader("Membaca data struk...");
                try {
                  const fileContent = await Filesystem.readFile({
                    path: file.uri,
                  });

                  let base64Data = "";
                  if (typeof fileContent.data === "string") {
                    base64Data = fileContent.data;
                  } else {
                    base64Data = await new Promise<string>((resolve, reject) => {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const base64String = reader.result as string;
                        const base64 = base64String.split(",")[1] || base64String;
                        resolve(base64);
                      };
                      reader.onerror = reject;
                      reader.readAsDataURL(fileContent.data as Blob);
                    });
                  }

                  setSharedData({
                    type: mime.startsWith("image/") ? "image" : "pdf",
                    base64: base64Data,
                    mimeType: mime,
                    name: file.name,
                  });

                  f7.dialog.close();

                  if (isLoggedInReactive.value) {
                    if (f7.views.main && f7.views.main.router) {
                      f7.views.main.router.navigate("/add-transaction/?source=share", {
                        reloadAll: false,
                      });
                    }
                  } else {
                    console.log(
                      "[ShareTarget] User is not logged in. Storing share data for post-login redirect."
                    );
                  }
                } catch (err: any) {
                  f7.dialog.close();
                  f7.dialog.alert("Gagal membaca file yang dibagikan: " + err.message, "Gagal");
                }
              }
            } else if (event.texts && event.texts.length > 0) {
              setSharedData({
                type: "text",
                text: event.texts[0],
              });
              if (isLoggedInReactive.value) {
                if (f7.views.main && f7.views.main.router) {
                  f7.views.main.router.navigate("/add-transaction/?source=share", {
                    reloadAll: false,
                  });
                }
              }
            } else if (event.title || event.value) {
              setSharedData({
                type: "text",
                text: event.value || event.title,
              });
              if (isLoggedInReactive.value) {
                if (f7.views.main && f7.views.main.router) {
                  f7.views.main.router.navigate("/add-transaction/?source=share", {
                    reloadAll: false,
                  });
                }
              }
            }
          });
        } catch (shareErr) {
          console.error("[ShareTarget] Error adding shareReceived listener:", shareErr);
        }
      }
    });
  });

  onBeforeUnmount(() => {
    const cap = (window as any).Capacitor;
    if (cap && cap.Plugins?.App) {
      cap.Plugins.App.removeAllListeners();
    }
  });
}
