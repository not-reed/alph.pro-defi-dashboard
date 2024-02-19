import { addressFromContractId } from "@alephium/web3";
import { config } from "../../config";
import type {
	BlockHash,
	ContractAddress,
	TransactionHash,
	UserAddress,
} from "../common/types/brands";
import type { ContractEvent } from "../node/types/events";

import type { ExplorerTransaction } from "./types/transactions";
import type { TokenBalance } from "../common/types/token";
import { mapRawInputToTokenBalance } from "../common/utils/token";
import { transformField } from "../common/types/fields";
import { logger } from "../logger";

async function getPaginatedResults(
	url: string,
	page = 1,
	limit = 100,
): Promise<unknown[]> {
	const results: unknown = await fetch(
		`${url}?limit=${limit}&page=${page}`,
	).then((a) => a.json());

	if (!results || !Array.isArray(results)) {
		throw new Error("Invalid results");
	}

	if (results.length === limit) {
		const y: unknown = await getPaginatedResults(url, page + 1, limit);
		return results.concat(y);
	}

	return results;
}
export default {
	block: {
		transactions: async (
			blockHash: BlockHash,
		): Promise<ExplorerTransaction[]> => {
			const url = `${config.EXPLORER_URL}/blocks/${blockHash}/transactions`;
			const transactions = await getPaginatedResults(url);

			return transactions.map((transaction): ExplorerTransaction => {
				if (
					!transaction ||
					typeof transaction !== "object" ||
					!("hash" in transaction) ||
					!("inputs" in transaction) ||
					!("outputs" in transaction) ||
					!Array.isArray(transaction.inputs) ||
					!Array.isArray(transaction.outputs)
				) {
					logger.error({ transaction, blockHash });
					throw new Error("Invalid transaction");
				}

				try {
					return {
						transactionHash: transaction.hash as TransactionHash,
						inputs: transaction.inputs.flatMap(mapRawInputToTokenBalance),
						outputs: transaction.outputs.flatMap(mapRawInputToTokenBalance),
					};
				} catch (err) {
					logger.error({ transaction, blockHash });
					throw err;
				}
			});
		},
	},
	contractEvents: {
		contractAddress: async (
			contractAddress: string,
		): Promise<ContractEvent[]> => {
			// TODO: pagination
			const url = `${config.EXPLORER_URL}/contract-events/contract-address/${contractAddress}?page=1&limit=100`;
			const contractEvents: unknown = await fetch(url).then((a) => a.json());

			if (!contractEvents || !Array.isArray(contractEvents)) {
				throw new Error("Invalid contractEvents");
			}

			if (contractEvents.length === 100) {
				throw new Error(
					`The time has come to handle pagination 2- explorer.contractEvents.contractAddress ${url}`,
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
