import type { TransactionHash } from "../../common/types/brands";
import type { TokenBalance } from "../../common/types/token";
import type { BlockEvent } from "./events";
interface OutputRef {
	hint: number;
	key: string;
}
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
	inputs: OutputRef[];
	gasAmount: bigint;
	gasPrice: bigint;
	outputs: TokenBalance[];
}
