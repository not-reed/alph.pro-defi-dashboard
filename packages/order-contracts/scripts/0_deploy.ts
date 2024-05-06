import type { Deployer, DeployFunction, Network } from "@alephium/cli";
import type { Settings } from "../alephium.config";
import { OrderManager } from "../artifacts/ts";

const deployFaucet: DeployFunction<Settings> = async (
	deployer: Deployer,
	network: Network<Settings>,
): Promise<void> => {
	const result = await deployer.deployContract(OrderManager, {
		initialFields: {
			owner: deployer.account.address,
			...network.settings.orderManager.initialFields,
		},
	});

	console.log(
		`OrderManager contract id: ${result.contractInstance.contractId}`,
	);
	console.log(
		`OrderManager contract address: ${result.contractInstance.address}`,
	);
};

export default deployFaucet;
