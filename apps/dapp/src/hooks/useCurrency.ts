import { computed, ref } from "vue";
import { usePrices } from "./usePrices";

const { prices } = usePrices();

export type Currency = keyof typeof formatters;

const DEFAULT_CURRENCY =
	(localStorage.getItem("user:currency") as Currency) || "USD";

const currency = ref<Currency>(DEFAULT_CURRENCY);

function setCurrency(currency_: Currency) {
	localStorage.setItem("user:currency", currency_);
	currency.value = currency_;
}

const cryptoSymbols = {
	ALPH: "ℵ",
	ETH: "Ξ",
	BTC: "₿",
};

function formatCrypto(currency_: keyof typeof cryptoSymbols) {
	const currency = currency_ === "ALPH" ? "ETH" : currency_;
	return {
		format: (amount: number) => {
			const options = {
				style: "currency",
				currency,
				minimumFractionDigits: 2,
				significantDigits: 8,
			};
			const numberFormat = new Intl.NumberFormat("en-US", options);
			const parts = numberFormat.formatToParts(amount);

			return parts.reduce((acc, part) => {
				switch (part.type) {
					case "currency": {
						// do whatever you need with the symbol.
						// here I just replace it with the value from the map
						return `${acc}${cryptoSymbols[currency_]}`;
					}
					default:
						return `${acc}${part.value}`;
				}
			}, "");
		},
	};
}
function formatFiat(currency: string) {
	return new Intl.NumberFormat(navigator.language, {
		style: "currency",
		currency: currency,
		minimumIntegerDigits: 1,
		minimumFractionDigits: 2,
		maximumFractionDigits: 15,
	});
}
const formatters = {
	// crypto
	BTC: formatCrypto("BTC"),
	ETH: formatCrypto("ETH"),
	ALPH: formatCrypto("ALPH"),

	// fiat
	AUD: formatFiat("AUD"),
	BGN: formatFiat("BGN"),
	BRL: formatFiat("BRL"),
	CAD: formatFiat("CAD"),
	CHF: formatFiat("CHF"),
	CNY: formatFiat("CNY"),
	CZK: formatFiat("CZK"),
	DKK: formatFiat("DKK"),
	EUR: formatFiat("EUR"),
	GBP: formatFiat("GBP"),
	HKD: formatFiat("HKD"),
	HUF: formatFiat("HUF"),
	IDR: formatFiat("IDR"),
	ILS: formatFiat("ILS"),
	INR: formatFiat("INR"),
	ISK: formatFiat("ISK"),
	JPY: formatFiat("JPY"),
	KRW: formatFiat("KRW"),
	MXN: formatFiat("MXN"),
	MYR: formatFiat("MYR"),
	NOK: formatFiat("NOK"),
	NZD: formatFiat("NZD"),
	PHP: formatFiat("PHP"),
	PLN: formatFiat("PLN"),
	RON: formatFiat("RON"),
	SEK: formatFiat("SEK"),
	SGD: formatFiat("SGD"),
	THB: formatFiat("THB"),
	TRY: formatFiat("TRY"),
	USD: formatFiat("USD"),
	ZAR: formatFiat("ZAR"),
};

export function formatCurrency(number: number, currency: Currency) {
	if (!number) return formatters[currency].format(0);

	const m = Math.floor(Math.log(number) / Math.log(10) + 1);
	if (m > 0) return formatters[currency].format(Math.round(number * 100) / 100);

	return formatters[currency].format(
		Math.round(number * 10 ** -m * 100) / 100 / 10 ** -m,
	);
}

const fiatRates = ref<{ [key: string]: number }>({});

async function updateFiatRates() {
	const rates = await fetch(
		`${import.meta.env.VITE_API_ENDPOINT}/api/prices/fiat`,
	).then((a) => a.json());

	const newRates: Record<string, number> = {};
	for (const rate of rates.currency) {
		newRates[rate.code] = 1 / (Number(BigInt(rate.rate) / 10n ** 14n) / 1e4);
	}

	fiatRates.value = newRates;
}

const exchangeRates = computed(() => {
	return {
		// biome-ignore lint/complexity/useLiteralKeys: token address
		ETH: prices["vP6XSUyjmgWCB2B9tD5Rqun56WJqDdExWnfwZVEqzhQb"],
		// biome-ignore lint/complexity/useLiteralKeys: token address
		BTC: prices["xUTp3RXGJ1fJpCGqsAY6GgyfRQ3WQ1MdcYR1SiwndAbR"],
		// biome-ignore lint/complexity/useLiteralKeys: token address
		ALPH: prices["tgx7VNFoP9DJiFMFgXXtafQZkUvyEdDHT9ryamHJYrjq"],
		USD: 1, // prices in usd by default,
		AUD: 1,
		BGN: 1,
		BRL: 1,
		CAD: 1,
		CHF: 1,
		CNY: 1,
		CZK: 1,
		DKK: 1,
		EUR: 1,
		GBP: 1,
		HKD: 1,
		HUF: 1,
		IDR: 1,
		ILS: 1,
		INR: 1,
		ISK: 1,
		JPY: 1,
		KRW: 1,
		MXN: 1,
		MYR: 1,
		NOK: 1,
		NZD: 1,
		PHP: 1,
		PLN: 1,
		RON: 1,
		SEK: 1,
		SGD: 1,
		THB: 1,
		TRY: 1,
		ZAR: 1,
		...fiatRates.value,
	};
});

// load fiat rates on start
updateFiatRates();

export function useCurrency() {
	return {
		currency,
		setCurrency,
		exchangeRates,
		format: (n: number, cur = currency.value) => {
			const offset = exchangeRates.value[cur];
			return formatCurrency(Math.max(n / offset, 0), cur);
		},
	};
}
