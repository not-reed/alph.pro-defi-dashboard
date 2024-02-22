import type { TransactionHash } from "../../common/types/brands";
import type { TokenBalance } from "../../common/types/token";
import { type Event } from "./event";

export interface Transaction {
	transactionHash: TransactionHash;
	gasAmount: bigint;
	gasPrice: bigint;
	inputs: TokenBalance[];
	outputs: TokenBalance[];
	events: Event[];
}
