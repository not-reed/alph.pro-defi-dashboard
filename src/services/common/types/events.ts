import type {
	BlockHash,
	ContractAddress,
	TransactionHash,
	UserAddress,
} from "./brands";
import type { Field } from "./fields";

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
