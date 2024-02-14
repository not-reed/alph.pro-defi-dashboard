import { config } from "../../config";
import type { Block } from "../common/types/blocks";
import type {
	BlockHash,
	ChainId,
	ContractAddress,
	TransactionHash,
	UserAddress,
} from "../common/types/brands";
import type { BlockEvent, ContractEvent } from "../common/types/events";
import type { Field } from "../common/types/fields";
import type { Transaction } from "../common/types/transactions";
import { addressFromContractId } from "@alephium/web3";

export default {
	blockFlow: {
		blocksWithEvents: async (
			fromTs: number,
			toTs: number,
		): Promise<Block[][]> => {
			const url = `${config.NODE_URL}/blockflow/blocks-with-events?fromTs=${fromTs}&toTs=${toTs}`;

			const result = await fetch(url).then((a) => a.json());
			if (!result || typeof result !== "object") {
				throw new Error("Invalid BlockFlow.blocksAndEvents");
			}

			const { blocksAndEvents: blocks, detail } = result as {
				blocksAndEvents: unknown[][];
				detail?: string;
			};
			// console.log({ blocks });
			if (detail) {
				throw new Error(`BlockFlow.blocksAndEvents: ${detail}`);
			}

			// 16 groups, 1 per shard/chain
			if (!blocks || !Array.isArray(blocks) || blocks.length !== 16) {
				throw new Error("Invalid BlockFlow.blocksAndEvents.blocks");
			}

			// TODO: fix types (check explorer)
			return blocks.map((blockGroup) => {
				if (!blockGroup || !Array.isArray(blockGroup)) {
					throw new Error("Invalid BlockFlow.blocksAndEvents.blockGroup");
				}

				return blockGroup.map((block) => {
					if (
						!block ||
						typeof block !== "object" ||
						!("block" in block) ||
						!("events" in block)
					) {
						throw new Error("Invalid BlockFlow.blocksAndEvents.block");
					}

					const { hash, timestamp, chainFrom, chainTo, height, transactions } =
						block.block as Record<string, unknown>;
					if (!transactions || !Array.isArray(transactions)) {
						throw new Error(
							"Invalid BlockFlow.blocksAndEvents.block.transactions",
						);
					}
					if (!block.events || !Array.isArray(block.events)) {
						throw new Error(
							"Invalid BlockFlow.blocksAndEvents.block.block.events",
						);
					}

					return {
						blockHash: hash as BlockHash,
						timestamp: timestamp as number,
						chainFrom: chainFrom as ChainId,
						chainTo: chainTo as ChainId,
						height: height as number,
						transactions: transactions.map((transaction) => {
							if (!transaction || typeof transaction !== "object") {
								throw new Error(
									"Invalid BlockFlow.blocksAndEvents.block.transactions.transaction",
								);
							}

							const { unsigned, generatedOutputs } = transaction as Record<
								string,
								unknown
							>;
							if (!unsigned || typeof unsigned !== "object") {
								throw new Error(
									"Invalid BlockFlow.blocksAndEvents.block.transactions.transaction.unsigned",
								);
							}

							if (!generatedOutputs || !Array.isArray(generatedOutputs)) {
								throw new Error(
									"Invalid BlockFlow.blocksAndEvents.block.transactions.transaction.generatedOutputs",
								);
							}

							const { txId, fixedOutputs } = unsigned as Record<
								string,
								unknown
							>;

							if (!fixedOutputs || !Array.isArray(fixedOutputs)) {
								throw new Error(
									"Invalid BlockFlow.blocksAndEvents.block.transactions.transaction.generatedOutputs",
								);
							}

							const events = (block.events as unknown[])
								.filter((event) => {
									if (
										!event ||
										typeof event !== "object" ||
										!("txId" in event)
									) {
										throw new Error(
											"Invalid BlockFlow.blocksAndEvents.block.transactions.transaction.event",
										);
									}

									return event.txId === txId;
								})
								.map((event): BlockEvent => {
									if (
										!event ||
										typeof event !== "object" ||
										!("txId" in event) ||
										!("contractAddress" in event) ||
										!("eventIndex" in event) ||
										!("fields" in event)
									) {
										throw new Error(
											"Invalid BlockFlow.blocksAndEvents.block.transactions.transaction.event",
										);
									}

									return {
										transactionHash: txId as TransactionHash,
										contractAddress: event.contractAddress as ContractAddress,
										eventIndex: event.eventIndex as number,
										fields: event.fields as Field[],
									} satisfies BlockEvent;
								});

							const outputs = fixedOutputs
								.concat(generatedOutputs)
								.flatMap((output) => {
									return [
										{
											userAddress: output.address as UserAddress,
											// alephium
											tokenAddress: addressFromContractId(
												"0000000000000000000000000000000000000000000000000000000000000000",
											) as ContractAddress,
											amount: BigInt(output.attoAlphAmount),
										},
									].concat(
										output.tokens.map((token: unknown) => {
											// console.log({
											// 	token,
											// 	time: new Date(Number(timestamp)).toLocaleString(),
											// });
											if (
												!token ||
												typeof token !== "object" ||
												!("id" in token) ||
												!("amount" in token) ||
												typeof token.id !== "string" ||
												typeof token.amount !== "string"
											) {
												throw new Error(
													"Invalid BlockFlow.blocksAndEvents.block.transactions.transaction.output.tokens.token",
												);
											}

											return {
												userAddress: output.address as UserAddress,
												tokenAddress: addressFromContractId(
													token.id,
												) as ContractAddress,
												amount: BigInt(token.amount),
											};
										}),
									);
								});

							return {
								transactionHash: txId as TransactionHash,
								outputs,
								events,
							} satisfies Transaction;
						}),
					} satisfies Block;
				});
			});
		},
		blocks: async (fromTs: number, toTs: number): Promise<Block[][]> => {
			const url = `${config.NODE_URL}/blockflow/blocks?fromTs=${fromTs}&toTs=${toTs}`;
			const result = await fetch(url).then((a) => a.json());
			if (!result || typeof result !== "object") {
				throw new Error("Invalid BlockFlow.blocks");
			}
			const { blocks, detail } = result as {
				blocks: unknown[][];
				detail?: string;
			};
			if (detail) {
				throw new Error(`BlockFlow.blocks: ${detail}`);
			}
			// 16 groups, 1 per shard/chain
			if (!blocks || !Array.isArray(blocks) || blocks.length !== 16) {
				throw new Error("Invalid BlockFlow.blocks.blocks");
			}

			// TODO: fix types (check explorer)
			return blocks.map((blockGroup) => {
				if (!blockGroup || !Array.isArray(blockGroup)) {
					throw new Error("Invalid BlockFlow.blocks.blockGroup");
				}

				return blockGroup.map((block) => {
					if (!block || typeof block !== "object") {
						throw new Error("Invalid BlockFlow.blocks.block");
					}

					const { hash, timestamp, chainFrom, chainTo, height, transactions } =
						block as Record<string, unknown>;

					if (!transactions || !Array.isArray(transactions)) {
						throw new Error("Invalid BlockFlow.blocks.block.transactions");
					}

					return {
						blockHash: hash as BlockHash,
						timestamp: timestamp as number,
						chainFrom: chainFrom as ChainId,
						chainTo: chainTo as ChainId,
						height: height as number,
						transactions: transactions.map((transaction) => {
							if (!transaction || typeof transaction !== "object") {
								throw new Error(
									"Invalid BlockFlow.blocks.block.transactions.transaction",
								);
							}

							const { unsigned, generatedOutputs } = transaction as Record<
								string,
								unknown
							>;
							if (!unsigned || typeof unsigned !== "object") {
								throw new Error(
									"Invalid BlockFlow.blocks.block.transactions.transaction.unsigned",
								);
							}

							if (!generatedOutputs || !Array.isArray(generatedOutputs)) {
								throw new Error(
									"Invalid BlockFlow.blocks.block.transactions.transaction.generatedOutputs",
								);
							}

							const { txId } = unsigned as Record<string, unknown>;

							return {
								transactionHash: txId as TransactionHash,
								outputs: [], // TODO: ?? maybe remove this whole function
								events: [],
							} satisfies Transaction;
						}),
					} satisfies Block;
				});
			});
		},
	},
};
