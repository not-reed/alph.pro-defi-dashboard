import type { BlockHash, ChainId } from "../../common/types/brands";
import type { Transaction } from "./transaction";

export interface Block {
	blockHash: BlockHash;
	timestamp: number;
	chainFrom: ChainId;
	chainTo: ChainId;
	height: number;
	transactions: Transaction[];
}
