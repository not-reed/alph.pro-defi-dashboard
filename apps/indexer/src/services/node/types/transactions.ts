import type { TransactionHash } from "../../common/types/brands";
import type { TokenBalance } from "../../common/types/token";
import type { BlockEvent } from "./events";

export interface NodeTransaction {
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
	// 	fixedOutputs: [];
	// };
	gasAmount: bigint;
	gasPrice: bigint;
	outputs: TokenBalance[];
}
