import type { TransactionHash } from "../../common/types/brands";
import type { TokenBalance } from "../../common/types/token";

export interface ExplorerTransaction {
	transactionHash: TransactionHash;
	inputs: TokenBalance[];
	outputs: TokenBalance[];
}
