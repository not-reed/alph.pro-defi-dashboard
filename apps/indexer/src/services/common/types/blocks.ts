import type { BlockHash, ChainId } from "./brands";
import type { ContractEvent } from "./events";
import type { Transaction } from "./transactions";

export interface Block {
	blockHash: BlockHash;
	timestamp: number;
	chainFrom: ChainId;
	chainTo: ChainId;
	height: number;
	transactions: Transaction[];
}
