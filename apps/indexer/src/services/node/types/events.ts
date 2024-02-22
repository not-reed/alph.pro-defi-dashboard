import type {
	ContractAddress,
	TransactionHash,
} from "../../common/types/brands";
import type { Field } from "../../common/types/fields";

export interface ContractEvent {
	// blockHash: BlockHash;
	transactionHash: TransactionHash;
	contractAddress: ContractAddress;
	// inputAddress: UserAddress;
	eventIndex: number;
	fields: Field[];
}

export interface BlockEvent {
	transactionHash: TransactionHash;
	contractAddress: ContractAddress;
	eventIndex: number;
	fields: Field[];
}
