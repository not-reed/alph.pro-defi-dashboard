import { config } from "../../config";
import type { Block } from "../node/types/blocks";
import type {
  BlockHash,
  ChainId,
  ContractAddress,
  TransactionHash,
} from "../common/types/brands";
import type { BlockEvent } from "../node/types/events";

import type { NodeTransaction } from "../node/types/transactions";

import { mapRawInputToTokenBalance } from "../common/utils/token";
import type { Field } from "../common/types/fields";
import { logger } from "../logger";
import type { NodeState } from "./types/state";

const headers: Record<string, string> = { Accept: "application/json" };

if (config.NODE_BASIC_AUTH) {
  headers.Authorization = `Basic ${config.NODE_BASIC_AUTH}`;
}

if (config.NODE_API_KEY) {
  headers["X-API-KEY"] = config.NODE_API_KEY;
}

export default {
  contracts: {
    async fetchState(address: ContractAddress): Promise<NodeState> {
      const url = `${config.NODE_URL}/contracts/${address}/state`;
      return await fetch(url, { headers }).then((a) => a.json());
    },
  },
  blockFlow: {
    blockWithEventsFromHash: async (hash: BlockHash): Promise<Block> => {
      // has to use this URL for backfill...
      const url = `https://wallet-v20.mainnet.alephium.org/blockflow/blocks-with-events/${hash}`;
      //   const url = `${config.NODE_URL}/blockflow/blocks-with-events/${hash}`;
      const result = await fetch(url).then((a) => a.json());
      //   const result = await fetch(url, { headers }).then((a) => a.json());
      if (
        [
          "00000000000306722ee145304ec09640853895bcb4c01974d5211019e40dd7f0",
          "000000000001941a40052289f0c2920a4d443b0e7cdfb0191c6498cb329b8740",
        ].includes(hash)
      ) {
        console.log(result);
      }
      return {
        blockHash: result.block.hash as BlockHash,
        timestamp: result.block.timestamp as number,
        chainFrom: result.block.chainFrom as ChainId,
        chainTo: result.block.chainTo as ChainId,
        height: result.block.height as number,
        transactions: result.block.transactions.map((transaction: any) => {
          if (!transaction || typeof transaction !== "object") {
            throw new Error(
              "Invalid BlockFlow.blocksAndEvents.block.transactions.transaction"
            );
          }

          const { unsigned, generatedOutputs, contractInputs } =
            transaction as Record<string, unknown>;
          if (!unsigned || typeof unsigned !== "object") {
            throw new Error(
              "Invalid BlockFlow.blocksAndEvents.block.transactions.transaction.unsigned"
            );
          }

          if (!generatedOutputs || !Array.isArray(generatedOutputs)) {
            throw new Error(
              "Invalid BlockFlow.blocksAndEvents.block.transactions.transaction.generatedOutputs"
            );
          }

          const { txId, fixedOutputs, inputs } = unsigned as Record<
            string,
            unknown
          >;

          if (!fixedOutputs || !Array.isArray(fixedOutputs)) {
            throw new Error(
              "Invalid BlockFlow.blocksAndEvents.block.transactions.transaction.fixedOutputs"
            );
          }

          if (!inputs || !Array.isArray(inputs)) {
            throw new Error(
              "Invalid BlockFlow.blocksAndEvents.block.transactions.transaction.inputs"
            );
          }

          const events = (result.events as unknown[])
            .filter((event) => {
              if (!event || typeof event !== "object" || !("txId" in event)) {
                throw new Error(
                  "Invalid BlockFlow.blocksAndEvents.block.transactions.transaction.event"
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
                  "Invalid BlockFlow.blocksAndEvents.block.transactions.transaction.event"
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
            .flatMap(mapRawInputToTokenBalance);

          return {
            transactionHash: txId as TransactionHash,
            gasAmount: BigInt(transaction.unsigned.gasAmount),
            gasPrice: BigInt(transaction.unsigned.gasPrice),
            inputs: inputs.map((a) => a.outputRef).concat(contractInputs),
            outputs,
            events,
          } satisfies NodeTransaction;
        }),
      } satisfies Block;
    },
    blocksWithEvents: async (
      fromTs: number,
      toTs: number
    ): Promise<Block[][]> => {
      const url = `${config.NODE_URL}/blockflow/blocks-with-events?fromTs=${fromTs}&toTs=${toTs}`;

      // fetch all blocks with events
      logger.debug(`Fetching blocks with events from ${fromTs} to ${toTs}`);
      const result = await fetch(url, { headers }).then((a) => a.json());

      if (!result || typeof result !== "object") {
        throw new Error("Invalid BlockFlow.blocksAndEvents");
      }

      const { blocksAndEvents: blocks, detail } = result as {
        blocksAndEvents: unknown[][];
        detail?: string;
      };

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
              "Invalid BlockFlow.blocksAndEvents.block.transactions"
            );
          }
          if (!block.events || !Array.isArray(block.events)) {
            throw new Error(
              "Invalid BlockFlow.blocksAndEvents.block.block.events"
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
                  "Invalid BlockFlow.blocksAndEvents.block.transactions.transaction"
                );
              }

              const { unsigned, generatedOutputs, contractInputs } =
                transaction as Record<string, unknown>;
              if (!unsigned || typeof unsigned !== "object") {
                throw new Error(
                  "Invalid BlockFlow.blocksAndEvents.block.transactions.transaction.unsigned"
                );
              }

              if (!generatedOutputs || !Array.isArray(generatedOutputs)) {
                throw new Error(
                  "Invalid BlockFlow.blocksAndEvents.block.transactions.transaction.generatedOutputs"
                );
              }

              const { txId, fixedOutputs, inputs } = unsigned as Record<
                string,
                unknown
              >;

              if (!fixedOutputs || !Array.isArray(fixedOutputs)) {
                throw new Error(
                  "Invalid BlockFlow.blocksAndEvents.block.transactions.transaction.fixedOutputs"
                );
              }

              if (!inputs || !Array.isArray(inputs)) {
                throw new Error(
                  "Invalid BlockFlow.blocksAndEvents.block.transactions.transaction.inputs"
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
                      "Invalid BlockFlow.blocksAndEvents.block.transactions.transaction.event"
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
                      "Invalid BlockFlow.blocksAndEvents.block.transactions.transaction.event"
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
                .flatMap(mapRawInputToTokenBalance);

              return {
                transactionHash: txId as TransactionHash,
                gasAmount: BigInt(transaction.unsigned.gasAmount),
                gasPrice: BigInt(transaction.unsigned.gasPrice),
                inputs: inputs.map((a) => a.outputRef).concat(contractInputs),
                outputs,
                events,
              } satisfies NodeTransaction;
            }),
          } satisfies Block;
        });
      });
    },
    // blocks: async (fromTs: number, toTs: number): Promise<Block[][]> => {
    // 	const url = `${config.NODE_URL}/blockflow/blocks?fromTs=${fromTs}&toTs=${toTs}`;
    // 	const result = await fetch(url, { headers }).then((a) => a.json());
    // 	if (!result || typeof result !== "object") {
    // 		throw new Error("Invalid BlockFlow.blocks");
    // 	}
    // 	const { blocks, detail } = result as {
    // 		blocks: unknown[][];
    // 		detail?: string;
    // 	};
    // 	if (detail) {
    // 		throw new Error(`BlockFlow.blocks: ${detail}`);
    // 	}
    // 	// 16 groups, 1 per shard/chain
    // 	if (!blocks || !Array.isArray(blocks) || blocks.length !== 16) {
    // 		throw new Error("Invalid BlockFlow.blocks.blocks");
    // 	}

    // 	// TODO: fix types (check explorer)
    // 	return blocks.map((blockGroup) => {
    // 		if (!blockGroup || !Array.isArray(blockGroup)) {
    // 			throw new Error("Invalid BlockFlow.blocks.blockGroup");
    // 		}

    // 		return blockGroup.map((block) => {
    // 			if (!block || typeof block !== "object") {
    // 				throw new Error("Invalid BlockFlow.blocks.block");
    // 			}

    // 			const { hash, timestamp, chainFrom, chainTo, height, transactions } =
    // 				block as Record<string, unknown>;

    // 			if (!transactions || !Array.isArray(transactions)) {
    // 				throw new Error("Invalid BlockFlow.blocks.block.transactions");
    // 			}

    // 			return {
    // 				blockHash: hash as BlockHash,
    // 				timestamp: timestamp as number,
    // 				chainFrom: chainFrom as ChainId,
    // 				chainTo: chainTo as ChainId,
    // 				height: height as number,
    // 				transactions: transactions.map((transaction) => {
    // 					if (!transaction || typeof transaction !== "object") {
    // 						throw new Error(
    // 							"Invalid BlockFlow.blocks.block.transactions.transaction",
    // 						);
    // 					}

    // 					const { unsigned, generatedOutputs } = transaction as Record<
    // 						string,
    // 						unknown
    // 					>;
    // 					if (!unsigned || typeof unsigned !== "object") {
    // 						throw new Error(
    // 							"Invalid BlockFlow.blocks.block.transactions.transaction.unsigned",
    // 						);
    // 					}

    // 					if (!generatedOutputs || !Array.isArray(generatedOutputs)) {
    // 						throw new Error(
    // 							"Invalid BlockFlow.blocks.block.transactions.transaction.generatedOutputs",
    // 						);
    // 					}

    // 					const { txId } = unsigned as Record<string, unknown>;

    // 					return {
    // 						transactionHash: txId as TransactionHash,
    // 						gasAmount: BigInt(transaction.unsigned.gasAmount),
    // 						gasPrice: BigInt(transaction.unsigned.gasPrice),
    // 						outputs: [], // TODO: ?? maybe remove this whole function
    // 						events: [],
    // 					} satisfies NodeTransaction;
    // 				}),
    // 			} satisfies Block;
    // 		});
    // });
    // },
  },
};
