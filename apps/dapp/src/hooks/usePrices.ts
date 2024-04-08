import { reactive } from "vue";
import type { Token } from "../types/token";

interface TokenPrice {
	token: Token;
	price: number;
	markets: {
		price: number;
		liquidity: string | null;
		source: string;
		sourceKey: string;
		timestamp: string;
	}[];
}

const prices = reactive<Record<string, number>>({});
const tokens = reactive<Record<string, TokenPrice["token"]>>({});
const markets = reactive<Record<string, TokenPrice["markets"]>>({});

async function updateAllPrices() {
	const tokens = Object.keys(prices);
	if (!tokens.length) {
		return;
	}

	await updatePrices(tokens);
}

setInterval(updateAllPrices, 1000 * 30);

async function updatePrices(tokenAddresses: string[]) {
	const query = new URLSearchParams({ address: [tokenAddresses].join(",") });
	const url = `${import.meta.env.VITE_API_ENDPOINT}/api/prices?${query}`;
	const data = await fetch(url).then((a) => a.json());

	if (!data || !("prices" in data) || !Array.isArray(data.prices)) {
		console.warn("Prices could not be loaded");
		return;
	}

	for (const price of data.prices) {
		tokens[price.token.address] = price.token;
		prices[price.token.address] = price.price / 1e18;
		markets[price.token.address] = price.markets;
	}
}

export function usePrices() {
	return { prices, markets, tokens, updatePrices };
}
