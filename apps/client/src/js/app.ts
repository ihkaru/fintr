import { createApp } from "vue";
import Framework7 from "framework7/lite-bundle";
// @ts-ignore
import Framework7Vue, { registerComponents } from "framework7-vue/bundle";
import App from "../components/App.vue";
import "../css/app.css";
import { registerServiceWorker } from "../composables/useAppUpdate";
import { initShareHandler } from "./shareHandler";

// Initialize native share handler immediately on cold boot
initShareHandler();

// Init Framework7 Vue plugin
Framework7.use(Framework7Vue);

const app = createApp(App);

// Register all Framework7 Vue components globally
registerComponents(app);

app.mount("#app");

// Register Service Worker for PWA / Share Target / Update detection
registerServiceWorker();
