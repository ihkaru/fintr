import { Capacitor } from "@capacitor/core";
import { CapacitorShareTarget } from "@capgo/capacitor-share-target";
import { Filesystem } from "@capacitor/filesystem";
import { useShareStore } from "./shareStore";
import { isLoggedInReactive } from "./api";
import { f7 } from "framework7-vue";

export function initShareHandler() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    CapacitorShareTarget.addListener("shareReceived", async (event: any) => {
      console.log("[ShareTarget] Received shared data:", JSON.stringify(event));
      const { setSharedData } = useShareStore();

      const navigateToApp = () => {
        if (isLoggedInReactive.value) {
          // Wait a short moment to ensure the router is fully initialized
          setTimeout(() => {
            if (f7.views.main && f7.views.main.router) {
              console.log("[ShareTarget] Navigating to /add-transaction/?source=share");
              f7.views.main.router.navigate("/add-transaction/?source=share", {
                reloadAll: false,
              });
            } else {
              console.log(
                "[ShareTarget] Router not ready yet, navigation will be handled by Home.vue on mount"
              );
            }
          }, 300);
        } else {
          console.log(
            "[ShareTarget] User is not logged in. Storing share data for post-login redirect."
          );
        }
      };

      if (event.files && event.files.length > 0) {
        const file = event.files[0];
        const mime = file.mimeType || "";

        // Support image, pdf, and fallback octet-stream / undefined mime types
        if (
          mime.startsWith("image/") ||
          mime === "application/pdf" ||
          mime === "application/octet-stream" ||
          !mime
        ) {
          const actualMime = mime || "image/jpeg";
          let preloaderActive = false;

          if (f7.dialog) {
            try {
              f7.dialog.preloader("Membaca data struk...");
              preloaderActive = true;
            } catch (e) {
              console.warn("[ShareTarget] Dialog preloader failed to open:", e);
            }
          }

          try {
            console.log("[ShareTarget] Reading file path:", file.uri);
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
              type: actualMime.includes("pdf") ? "pdf" : "image",
              base64: base64Data,
              mimeType: actualMime,
              name: file.name,
            });

            if (preloaderActive && f7.dialog) {
              try {
                f7.dialog.close();
              } catch {}
            }

            navigateToApp();
          } catch (err: any) {
            if (preloaderActive && f7.dialog) {
              try {
                f7.dialog.close();
              } catch {}
            }
            if (f7.dialog) {
              f7.dialog.alert("Gagal membaca file yang dibagikan: " + err.message, "Gagal");
            }
            console.error("[ShareTarget] Error reading file:", err);
          }
        } else {
          console.warn("[ShareTarget] Unsupported mime type ignored:", mime);
        }
      } else if (event.texts && event.texts.length > 0) {
        setSharedData({
          type: "text",
          text: event.texts[0],
        });
        navigateToApp();
      } else if (event.title || event.value) {
        setSharedData({
          type: "text",
          text: event.value || event.title,
        });
        navigateToApp();
      }
    });
    console.log("[ShareTarget] Listener registered successfully in app.ts.");
  } catch (err) {
    console.error("[ShareTarget] Error adding listener:", err);
  }
}
