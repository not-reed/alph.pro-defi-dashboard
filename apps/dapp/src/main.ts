import "./polyfill";
import { createApp } from "vue";
import "nprogress/nprogress.css";
import "./style.css";
import App from "./App.vue";
import { router } from "./router";
import { usePrices } from "./hooks/usePrices";
import Toast from "vue-toastification";
import * as Sentry from "@sentry/vue";
import "vue-toastification/dist/index.css";
import Popper from "vue3-popper";

const app = createApp(App);

Sentry.init({
	app,
	dsn: import.meta.env.VITE_SENTRY_DSN,
	integrations: [
		Sentry.browserTracingIntegration({ router }),
		Sentry.replayIntegration(),
	],

	environment: import.meta.env.VITE_SENTRY_ENVIRONMENT,

	// Set tracesSampleRate to 1.0 to capture 100%
	// of transactions for performance monitoring.
	// We recommend adjusting this value in production
	tracesSampleRate: 1.0,

	// Set `tracePropagationTargets` to control for which URLs distributed tracing should be enabled
	tracePropagationTargets: ["localhost", /^https:\/\/alph\.pro\/api/],

	// Capture Replay for 10% of all sessions,
	// plus for 100% of sessions with an error
	replaysSessionSampleRate: 0.1,
	replaysOnErrorSampleRate: 1.0,
});

app
	.component("Popper", Popper)
	.use(router)
	.use(Toast, {
		transition: "Vue-Toastification__bounce",
		maxToasts: 3,
		newestOnTop: true,
	})
	.mount("#app");

const { updatePrices } = usePrices();
// load core prices once at page load
updatePrices([
	"tgx7VNFoP9DJiFMFgXXtafQZkUvyEdDHT9ryamHJYrjq", // alph
	"vT49PY8ksoUL6NcXiZ1t2wAmC7tTPRfFfER8n3UCLvXy", // ayin
	"xUTp3RXGJ1fJpCGqsAY6GgyfRQ3WQ1MdcYR1SiwndAbR", // btc
	"vP6XSUyjmgWCB2B9tD5Rqun56WJqDdExWnfwZVEqzhQb", // eth
	"zSRgc7goAYUgYsEBYdAzogyyeKv3ne3uvWb3VDtxnaEK", // usdt
]);
