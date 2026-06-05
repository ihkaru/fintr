import { createApp } from "vue";
import Framework7 from "framework7/lite-bundle";
// @ts-ignore
import Framework7Vue, { registerComponents } from "framework7-vue/bundle";
import App from "../components/App.vue";
import "../css/app.css";

// Init Framework7 Vue plugin
Framework7.use(Framework7Vue);

const app = createApp(App);

// Register all Framework7 Vue components globally
registerComponents(app);

app.mount("#app");

// Register Service Worker for PWA / Share Target
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then(
      registration => console.log("ServiceWorker registered with scope: ", registration.scope),
      err => console.error("ServiceWorker registration failed: ", err)
    );
  });
}
