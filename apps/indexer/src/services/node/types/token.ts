import type { ContractId } from "../../common/types/brands";

export interface Token {
	id: ContractId;
	amount: `${number}`;
}
