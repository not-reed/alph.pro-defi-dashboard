import { DUST_AMOUNT, NodeProvider, ONE_ALPH } from "@alephium/web3";
import { PrivateKeyWallet } from "@alephium/web3-wallet";
import { Withdraw } from "artifacts/ts";
import { loadDeployments } from "artifacts/ts/deployments";

const { PRIVATE_KEYS, MAINNET_NODE_URL } = process.env;

if (PRIVATE_KEYS === undefined) {
	throw new Error("PRIVATE_KEYS is not set");
}
if (MAINNET_NODE_URL === undefined) {
	throw new Error("MAINNET_NODE_URL is not set");
}

const [privateKey] = PRIVATE_KEYS.split(",");

const nodeProvider = new NodeProvider(MAINNET_NODE_URL);

const signer = new PrivateKeyWallet({
	privateKey,
	nodeProvider,
});

const deployments = loadDeployments("mainnet");

const orderManager = deployments.contracts.OrderManager.contractInstance;

const balance = await nodeProvider.addresses.getAddressesAddressBalance(
	orderManager.address,
);

console.log(`Withdrawing ${balance.balanceHint}`);

const tx = await Withdraw.execute(signer, {
	initialFields: {
		orderManager:
			deployments.contracts.OrderManager.contractInstance.contractId,
		amount: BigInt(balance.balance) - ONE_ALPH,
	},
	attoAlphAmount: DUST_AMOUNT,
});

console.log(`Withdraw transaction: ${tx.txId}`);
console.log(`https://explorer.alephium.org/transactions/${tx.txId}`);
