import { createApp } from "vue";
import "nprogress/nprogress.css";
import "./style.css";
import App from "./App.vue";
import { router } from "./router";

createApp(App).use(router).mount("#app");

console.log({ env: import.meta.env });
