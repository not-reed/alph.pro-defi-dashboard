import type { ContractAddress } from "../../common/types/brands";
import type { Field } from "../../common/types/fields";
import type { Token } from "./token";

export interface NodeState {
	address: ContractAddress;
	bytecode: string;
	codeHash: string;
	initialStateHash: string;
	immFields: Field[];
	mutFields: Field[];
	asset: {
		attoAlphAmount: `${number}`;
		tokens?: Token[];
	};
}
