import type { ExecuteScriptResult } from "@alephium/web3";
import { testAddress, testNodeWallet } from "@alephium/web3-test";
import { OrderManager } from "artifacts/ts";
import config from "alephium.config";

export function calculateGas(tx: ExecuteScriptResult) {
	return BigInt(tx.gasAmount) * BigInt(tx.gasPrice);
}

export async function deployOrderManager() {
	const deployer = await testNodeWallet();

	const deploy = await OrderManager.deploy(deployer, {
		initialFields: {
			owner: testAddress,
			...config.networks.devnet.settings.orderManager.initialFields,
		},
	});

	return deploy.contractInstance;
}
