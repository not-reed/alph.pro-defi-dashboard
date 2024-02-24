import { createApp } from "vue";
import "nprogress/nprogress.css";
import "./style.css";
import App from "./App.vue";
import { router } from "./router";
import { usePrices } from "./hooks/usePrices";

createApp(App).use(router).mount("#app");

const { prices, markets, updatePrices } = usePrices();

await updatePrices([
	"tgx7VNFoP9DJiFMFgXXtafQZkUvyEdDHT9ryamHJYrjq", // alph
	"vT49PY8ksoUL6NcXiZ1t2wAmC7tTPRfFfER8n3UCLvXy", // ayin
	"xUTp3RXGJ1fJpCGqsAY6GgyfRQ3WQ1MdcYR1SiwndAbR", // btc
	"vP6XSUyjmgWCB2B9tD5Rqun56WJqDdExWnfwZVEqzhQb", // eth
	"zSRgc7goAYUgYsEBYdAzogyyeKv3ne3uvWb3VDtxnaEK", // usdt
]);
console.log({ prices, markets });
