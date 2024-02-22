import type { ContractAddress } from "../../common/types/brands";
import type { Field } from "../../common/types/fields";

export interface Event {
	// transactionHash: TransactionHash;
	contractAddress: ContractAddress;
	eventIndex: number;
	fields: Field[];
}
