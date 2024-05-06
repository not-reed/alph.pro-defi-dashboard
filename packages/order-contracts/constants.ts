import { ONE_ALPH } from "@alephium/web3";

export const ONE_MONTH_IN_MS = 2628000000n as const;
export const THREE_MONTH_IN_MS = 7884000000n as const;
export const SIX_MONTH_IN_MS = 15768000000n as const;
export const ONE_YEAR_IN_MS = 31536000000n as const;

export const BASE_PRICE_PER_MONTH = 5n * ONE_ALPH;
export const PRICE_PER_MS = BASE_PRICE_PER_MONTH / ONE_MONTH_IN_MS;
