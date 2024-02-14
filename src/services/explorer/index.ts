import { config } from "../../config";
import type {
	BlockHash,
	ContractAddress,
	TransactionHash,
	UserAddress,
} from "../common/types/brands";
import type { ContractEvent } from "../common/types/events";
import { transformField } from "../common/types/fields";

export default {
	contractEvents: {
		contractAddress: async (
			contractAddress: string,
		): Promise<ContractEvent[]> => {
			// TODO: pagination
			const url = `${config.EXPLORER_URL}/contract-events/contract-address/${contractAddress}?page=1&limit=100`;
			const contractEvents: unknown[] = await fetch(url).then((a) => a.json());

			if (contractEvents.length === 100) {
				throw new Error(
					"The time has come to handle pagination - explorer.contractEvents.contractAddress",
				);
			}

			return contractEvents.map((obj: unknown): ContractEvent => {
				if (!obj || typeof obj !== "object") {
					throw new Error("Invalid ContractEvent");
				}

				const {
					// blockHash,
					txHash,
					contractAddress,
					// inputAddress,
					eventIndex,
					fields,
				} = obj as Record<string, unknown>;

				if (!fields || !Array.isArray(fields)) {
					throw new Error("Invalid ContractEvent.fields");
				}
				return {
					// blockHash: blockHash as BlockHash,
					transactionHash: txHash as TransactionHash,
					contractAddress: contractAddress as ContractAddress,
					// inputAddress: inputAddress as UserAddress, // TODO: can this also be a contract address?
					eventIndex: eventIndex as number,
					fields: fields.map(transformField),
				} satisfies ContractEvent;
			});
		},
	},
};
