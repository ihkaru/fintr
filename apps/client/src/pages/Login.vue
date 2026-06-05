<template>
  <f7-page no-navbar name="login" style="--f7-page-bg-color: #faf3e0">
    <div
      class="login-container"
      style="
        background: #faf3e0;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 32px 24px;
      "
    >
      <!-- Main Brand Logo -->
      <div
        class="logo font-headline"
        style="
          font-size: 54px;
          font-weight: 800;
          background: linear-gradient(135deg, #0f5238, #485f84);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 8px;
          letter-spacing: -0.04em;
        "
      >
        FamiVault
      </div>
      <p
        class="tagline font-body"
        style="
          font-size: 15px;
          color: #404943;
          margin-bottom: 48px;
          line-height: 1.5;
          font-weight: 500;
        "
      >
        Kelola keuangan rumah tangga bersama pasangan<br />
        dengan sistem amplop zero-based digital 🌸
      </p>

      <!-- Collaborative Couple Art/Illustration Card -->
      <div
        style="
          width: 100%;
          max-width: 320px;
          background: #ffffff;
          border: 1px solid #bfc9c1;
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 40px;
          box-shadow: 0 4px 12px rgba(15, 82, 56, 0.05);
          text-align: left;
        "
      >
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px">
          <div
            style="width: 40px; height: 40px; rounded-full; overflow: hidden; border: 2px border-primary-fixed; border-radius: 50%;"
          >
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDtp3uWK4cVYS2kOQ_OUTzYv0hr6bEpkkvJ0Q8ZMe9--gqBOmtfQtAaJ6ylLYel-eK41n9UUTP9H_mJs9W2kzh6VelvQps89jF0AILbx5WCdAzXV0EUJsLjauWzQfqTyKgOAdbvLUa16HL7ZifdDJPBA0GeC-5Xot_Y3GTucDqimonCTBM4uauZEat1eY7-t_ArY5gV1jLWvMIDLtSFuU8qbrpRCYVIgaYMej58a3SZ-BQcDTLrf7qYpDkKIZw9mxsvMhyCy8wPCLRb"
              style="width: 100%; h-full; object-fit: cover;"
            />
          </div>
          <div>
            <div style="font-size: 14px; font-weight: 700; color: #161a32">
              Kolaborasi Real-time
            </div>
            <div style="font-size: 12px; color: #707973">Ihsan & Pasangan</div>
          </div>
        </div>
        <div style="font-size: 12px; color: #404943; line-height: 1.4">
          "Satu dompet bersama, alokasi amplop jelas, tidak ada lagi pengeluaran misterius."
        </div>
      </div>

      <button
        class="google-btn"
        @click="handleGoogleLogin"
        :disabled="loading"
        style="box-shadow: 0 4px 20px rgba(15, 82, 56, 0.1)"
      >
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        {{ loading ? "Memproses..." : "Masuk dengan Google" }}
      </button>

      <!-- Demo Login bypass for developer -->
      <button
        style="
          margin-top: 16px;
          background: #ffffff;
          color: #0f5238;
          border: 1px solid #0f5238;
          border-radius: 12px;
          padding: 12px 32px;
          width: 100%;
          max-width: 320px;
          font-weight: 700;
          cursor: pointer;
          font-size: 15px;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(15, 82, 56, 0.05);
        "
        @click="handleDemoLogin"
      >
        Mode Demo (Cepat) 🚀
      </button>

      <!-- App Download Options -->
      <div
        style="
          margin-top: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          width: 100%;
          max-width: 320px;
          border-top: 1px dashed #bfc9c1;
          padding-top: 24px;
        "
      >
        <div
          style="
            font-size: 11px;
            color: #404943;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          "
        >
          Gunakan Aplikasi Android
        </div>
        <a
          href="https://github.com/ihkaru/fintr/releases/latest"
          target="_blank"
          class="external"
          style="
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            background: #0f5238;
            color: #ffffff;
            border-radius: 12px;
            padding: 12px 24px;
            width: 100%;
            box-sizing: border-box;
            font-weight: 700;
            text-decoration: none;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(15, 82, 56, 0.15);
            transition: all 0.2s ease;
          "
        >
          <span class="material-symbols-outlined" style="font-size: 18px">download</span>
          Unduh Aplikasi (.APK)
        </a>
      </div>

      <p style="margin-top: 32px; font-size: 12px; color: #707973">
        Data kamu aman — terenkripsi penuh untuk keluarga.
      </p>
    </div>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { f7 } from "framework7-vue";
import { auth, setToken, setUser } from "../js/api";
import { GoogleSignIn } from "@capawesome/capacitor-google-sign-in";
import { Capacitor } from "@capacitor/core";

const loading = ref(false);

const loginToBackend = async (idToken: string) => {
  loading.value = true;
  try {
    const res = await auth.loginWithGoogle(idToken);
    setToken(res.token);
    setUser(res.user);
    if (f7.views.main && f7.views.main.router) {
      f7.views.main.router.navigate("/", { reloadAll: true });
    }
  } catch (err: any) {
    f7.dialog.alert("Gagal masuk: " + err.message, "Error");
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  // Untuk web PWA: tangkap id_token dari hash setelah redirect Google OAuth
  const hash = window.location.hash;
  if (hash.includes("id_token=")) {
    const params = new URLSearchParams(hash.substring(1));
    const idToken = params.get("id_token");
    if (idToken) {
      window.history.replaceState(null, "", window.location.pathname);
      await loginToBackend(idToken);
    }
  }
});

const handleGoogleLogin = async () => {
  if (Capacitor.isNativePlatform()) {
    // ✅ Best practice Juni 2026: Native Credential Manager API via @capawesome/capacitor-google-sign-in
    // Tidak membuka Chrome/browser — Google Sign-In muncul sebagai native bottom sheet
    loading.value = true;
    try {
      const config = await auth.getConfig();
      if (!config?.googleClientId) {
        f7.dialog.alert(
          "Google OAuth belum dikonfigurasi. Gunakan 'Mode Demo' untuk pengujian.",
          "Setup Diperlukan"
        );
        return;
      }

      // Initialize wajib dilakukan sebelum signIn(), menggunakan Web Application Client ID
      await GoogleSignIn.initialize({ clientId: config.googleClientId });
      const result = await GoogleSignIn.signIn();

      if (!result.idToken) {
        throw new Error("Tidak dapat mengambil ID token dari Google.");
      }

      await loginToBackend(result.idToken);
    } catch (e: any) {
      // Abaikan jika user sengaja membatalkan sign-in
      if (
        e?.message?.toLowerCase().includes("cancel") ||
        e?.code === "CANCELED" ||
        e?.code === 12501
      ) {
        return;
      }
      f7.dialog.alert("Google Sign-In gagal: " + (e?.message ?? "Unknown error"), "Error");
    } finally {
      loading.value = false;
    }
  } else {
    // Fallback untuk PWA / Web: redirect ke halaman Google OAuth
    loading.value = true;
    try {
      const config = await auth.getConfig();
      if (!config?.googleClientId) {
        f7.dialog.alert(
          "Google OAuth belum dikonfigurasi. Gunakan 'Mode Demo' untuk pengujian.",
          "Setup Diperlukan"
        );
        return;
      }
      const nonce = Math.random().toString(36).substring(2);
      const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(config.googleClientId)}&redirect_uri=${encodeURIComponent(window.location.origin + "/")}&response_type=id_token&scope=openid%20email%20profile&nonce=${nonce}`;
      window.location.href = url;
    } catch (e: any) {
      f7.dialog.alert("Gagal memuat konfigurasi: " + (e?.message ?? "Unknown error"), "Error");
      loading.value = false;
    }
  }
};

const handleDemoLogin = async () => {
  loading.value = true;
  try {
    const res = await auth.loginWithGoogle("demo-token");
    setToken(res.token);
    setUser(res.user);
    if (f7.views.main && f7.views.main.router) {
      f7.views.main.router.navigate("/", { reloadAll: true });
    }
  } catch (err: any) {
    f7.dialog.alert("Gagal masuk mode demo: " + err.message, "Error");
  } finally {
    loading.value = false;
  }
};
</script>
