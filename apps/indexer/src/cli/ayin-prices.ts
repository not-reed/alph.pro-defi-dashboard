import type { ContractAddress } from "../services/common/types/brands";
import {
	saveCoingeckoPrices,
	saveOnChainPrices,
	updateCoinGeckoPrices,
} from "../tasks/prices";

export async function getAyinPrices() {
	await updateCoinGeckoPrices();
	await saveCoingeckoPrices();
	await saveOnChainPrices();
}
