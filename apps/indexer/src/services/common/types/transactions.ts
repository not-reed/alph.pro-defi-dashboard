import type { ContractAddress, TransactionHash } from "./brands";
import type { BlockEvent } from "./events";

interface TokenOutput {
	tokenAddress: ContractAddress;
	amount: bigint;
}

export interface Transaction {
	transactionHash: TransactionHash;
	events: BlockEvent[];
	// TODO: add fields as needed
	// unsigned: {
	// 	txId: string;
	// 	version: number;
	// 	networkId: number;
	// 	gasAmount: number;
	// 	gasPrice: number;
	// 	inputs: [];
	// 	fixedOutputs: []; // TODO: loop all tokens here, detect type, handle accordingly
	// };
	outputs: TokenOutput[]; // TODO: loop all tokens here, detect type, handle accordingly
}
