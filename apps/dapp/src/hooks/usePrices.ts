import { reactive } from "vue";

interface TokenPrice {
	token: {
		id: string;
		address: string;
		symbol: string;
		name: string;
		decimals: number;
		logo: string;
		description: string;
		verified: boolean;
	};
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
const markets = reactive<Record<string, TokenPrice["markets"]>>({});

async function updatePrices(tokenAddresses: string[]) {
	const query = new URLSearchParams({ address: [tokenAddresses].join(",") });
	const url = `${import.meta.env.VITE_API_ENDPOINT}/api/prices?${query}`;
	const data = await fetch(url).then((a) => a.json());

	if (!data || !("prices" in data) || !Array.isArray(data.prices)) {
		console.warn("Prices could not be loaded");
		return;
	}

	console.log({ data });

	for (const price of data.prices) {
		prices[price.token.address] = price.price;
		markets[price.token.address] = price.markets;
	}
}

export function usePrices() {
	return { prices, markets, updatePrices };
}
