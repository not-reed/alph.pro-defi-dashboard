import { computed, ref } from "vue";
import { usePrices } from "./usePrices";
const { prices } = usePrices();
export type Currency = "USD" | "BTC" | "ALPH" | "ETH";

const currency = ref<Currency>("USD");

function setCurrency(currency_: Currency) {
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

const formatters = {
  USD: new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumIntegerDigits: 1,
    minimumFractionDigits: 2,
    maximumFractionDigits: 15,
  }),
  BTC: formatCrypto("BTC"),
  ETH: formatCrypto("ETH"),
  ALPH: formatCrypto("ALPH"),
};

export function formatCurrency(number: number, currency: Currency) {
  if (!number) return formatters[currency].format(0);

  const m = Math.floor(Math.log(number) / Math.log(10) + 1);
  if (m > 0) return formatters[currency].format(Math.round(number * 100) / 100);

  return formatters[currency].format(
    Math.round(number * 10 ** -m * 100) / 100 / 10 ** -m
  );
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
  };
});
export function useCurrency() {
  return {
    currency,
    setCurrency,
    exchangeRates,
    format: (n: number, cur = currency.value) => {
      const offset = exchangeRates.value[cur];
      return formatCurrency(n / offset, cur);
    },
  };
}
