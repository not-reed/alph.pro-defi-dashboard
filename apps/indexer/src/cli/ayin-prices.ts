import { ALPH_ADDRESS } from "../core/constants";
import { db } from "../database/db";
import type { NewCurrentPrice } from "../database/schemas/public/CurrentPrice";
import type { ContractAddress } from "../services/common/types/brands";
import BigNumber from "bignumber.js";
import { logger } from "../services/logger";
import {
	saveCoingeckoPrices,
	saveOnChainPrices,
	updateCoinGeckoPrices,
} from "../tasks/prices";

// async function fetchCoingeckoPrice(): Promise<any> {
// 	return await fetch(
// 		"https://api.coingecko.com/api/v3/simple/price?ids=alephium,ayin,bitcoin,ethereum,tether&vs_currencies=usd",
// 	).then((a) => a.json());
// }

const AYIN_ADDRESS =
	"vT49PY8ksoUL6NcXiZ1t2wAmC7tTPRfFfER8n3UCLvXy" as ContractAddress;

export async function getAyinPrices() {
	await updateCoinGeckoPrices();
	await saveCoingeckoPrices();
	await saveOnChainPrices();
}
