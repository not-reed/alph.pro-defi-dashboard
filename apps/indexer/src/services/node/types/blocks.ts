import type { BlockHash, ChainId } from "../../common/types/brands";
import type { NodeTransaction } from "./transactions";

export interface Block {
	blockHash: BlockHash;
	timestamp: number;
	chainFrom: ChainId;
	chainTo: ChainId;
	height: number;
	transactions: NodeTransaction[];
}
