import { ayinPoolReserves } from "../tasks/pools";

export async function fillAyinPools() {
	await ayinPoolReserves();
}
