import { ALPH_ADDRESS, MAX_DURATION } from "../../core/constants";
import type { Block } from "./types/block";
import type { Block as NodeBlock } from "../node/types/blocks";
import nodeService from "../node";
import explorerService from "../explorer";
import DataLoader from "dataloader";
import type {
  BlockHash,
  ContractAddress,
  FieldType,
  UserAddress,
} from "../common/types/brands";
import type { ExplorerTransaction } from "../explorer/types/transactions";
import { logger } from "../logger";
import { chunkArray } from "../../utils/arrays";
import type { Artifact } from "../common/types/artifact";
import { parseValue } from "../common/types/fields";
import { addressFromTokenId } from "@alephium/web3";
import type { NodeState } from "../node/types/state";
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const timeoutMap = new Map<BlockHash, number>();
const transactionMap = new Map<BlockHash, ExplorerTransaction[]>();
function resetCacheTimer(
  hash: BlockHash,
  transactions?: ExplorerTransaction[]
) {
  if (transactions) {
    transactionMap.set(hash, transactions);
  }
  setTimeout(() => {
    const time = timeoutMap.get(hash);
    if (time && time <= Date.now()) {
      // remove timeout
      timeoutMap.delete(hash);
      // clear cached results
      transactionMap.delete(hash);
      // reset dataloader
      transactionLoader.clear(hash);
    }
  }, 15_000);
}
const transactionLoader = new DataLoader<BlockHash, ExplorerTransaction[]>(
  async (hashes) => {
    // for (const hash of hashes) {
    // 	// refresh to clear cache every 30 seconds if unused
    // 	timeoutMap.set(hash, Date.now() + 5_000);
    // }

    // setTimeout(() => {
    // 	// TODO: temp fix, clears all cache
    // 	transactionLoader.clearAll();
    // 	const now = Date.now();
    // 	for (const [hash, time] of timeoutMap) {
    // 		if (time <= now) {
    // 			// logger.info(`Clearing Cache ${hash}`);
    // 			transactionLoader.clear(hash);
    // 			timeoutMap.delete(hash);
    // 			transactionMap.delete(hash);
    // 		}
    // 	}
    // }, 10_000);

    // const t = Date.now();
    // const transactions: ExplorerTransaction[][] = [];
    // for (const hash of hashes) {
    // 	const cached = transactionMap.get(hash);
    // 	if (cached) {
    // 		transactions.push(cached);
    // 	} else {
    // 		const transaction = await explorerService.block.transactions(hash);
    // 		transactions.push(transaction);
    // 		transactionMap.set(hash, transaction);
    // 	}
    // 	// sequentially to try and not overwhelm the poor explorer 😢
    // 	// await wait(50);
    // }

    const chunks = chunkArray(hashes, 10);

    let cachedCounter = 0;
    const transactions: ExplorerTransaction[][] = [];
    logger.info(`transaction fetching starting - ${hashes.length} hashes`);
    for (const hashChunk of chunks) {
      await Promise.all(
        hashChunk.map(async (hash) => {
          timeoutMap.set(hash, Date.now() + 10_000);

          const cached = transactionMap.get(hash);

          if (cached) {
            cachedCounter++;
            transactions.push(cached);
            resetCacheTimer(hash);
            return;
          }

          const transaction = await explorerService.block.transactions(hash);
          transactions.push(transaction);
          resetCacheTimer(hash, transaction);
          return;
        })
      );

      // await wait(50)
    }
    logger.info("transaction fetching complete");

    return transactions;
  }
);

// const blockLoader = new DataLoader<number, Block>(
// 	async (timestamps) => {
// 		const MAX_COUNT = MAX_DURATION
// 		const chunks = Array.from(new Set(timestamps)).sort((a,b) => a - b).reduce((acc,cur) => {
// 			const idx = acc.length - 1

// 			  // brand new entry
// 			  if (!acc[idx]?.length) {
// 				  acc[idx + 1] = [cur]
// 				  return acc
// 			  }

// 			  // make sure cur is exactly previous max + 1 and current array isn't too long
// 			  const arr = acc[idx]
// 			  if (arr[arr.length - 1] === cur -1 && arr.length < MAX_COUNT) {
// 				  acc[idx].push(cur)
// 				  return acc
// 			  }

// 			  acc.push([cur])
// 			  return acc;
// 		  }, [] as number[][])

// 		  // most efficient possible
// 		  const blocks = await Promise.all(chunks.map(chunk => nodeService.blockFlow.blocks(chunk[0], chunk[chunk.length - 1] + 1)))

// 		  // TODO: figure out how to map these results back to the original timestamps

// 		//   return timestamps.map((timestamp, idx) => blocks.filter(b => b.)
// 	}
// );

const timeoutBlockMap = new Map<`${number}-${number}`, number>();
const blockMap = new Map<`${number}-${number}`, NodeBlock[][]>();
const basicBlockDataLoader = new DataLoader<
  `${number}-${number}`,
  NodeBlock[][]
>(async (timestamps) => {
  for (const hash of timestamps) {
    // refresh to clear cache every 30 seconds if unused
    const now = Date.now();
    timeoutBlockMap.set(hash, now + 5_000);
  }
  setTimeout(() => {
    // TODO: temp fix, clears all cache
    basicBlockDataLoader.clearAll();

    const now = Date.now();
    for (const [hash, time] of timeoutBlockMap) {
      if (time <= now) {
        basicBlockDataLoader.clear(hash);
        timeoutBlockMap.delete(hash);
        blockMap.delete(hash);
      }
    }
  }, 10_000);

  const t = Date.now();

  let cachedCounter = 0;
  const results = await Promise.all(
    timestamps.map(async (hash) => {
      const [from, to] = hash.split("-").map(Number);
      const cached = blockMap.get(`${from}-${to}`);
      if (cached) {
        cachedCounter++;
        return cached;
      }
      const blocks = await nodeService.blockFlow.blocksWithEvents(from, to);
      blockMap.set(`${from}-${to}`, blocks);
      return blocks;
    })
  );
  logger.info("block fetching complete");
  // logger.info(
  // 	`Block Batch took ${Date.now() - t}ms for ${
  // 		timestamps.length
  // 	} block (${cachedCounter} cached) - (${timeoutMap.size} to be cleared)`,
  // );

  return results;
});

// debugging, can remove later
const missedTransactions = new Set();

export default {
  async getLatestBlock() {
    return await explorerService.block.latest();
  },
  async fetchHolders(address: ContractAddress): Promise<UserAddress[]> {
    return await explorerService.contracts.fetchHolders(address);
  },
  async fetchSubContracts(
    address: ContractAddress
  ): Promise<ContractAddress[]> {
    return await explorerService.contracts.fetchSubContracts(address);
  },

  async fetchParentContract(
    address: ContractAddress
  ): Promise<ContractAddress | null> {
    return await explorerService.contracts.fetchParentContract(address);
  },

  async fetchSiblingContracts(
    address: ContractAddress
  ): Promise<ContractAddress[]> {
    const parent = await this.fetchParentContract(address);
    if (!parent) {
      return [];
    }
    return await this.fetchSubContracts(parent);
  },

  async fetchState(address: ContractAddress, abi?: Artifact) {
    const rawState = await nodeService.contracts.fetchState(address);
    logger.error(`Failed to fetch state for address: ${address}`);
    if (!abi) {
      return rawState;
    }

    return {
      address,
      ...this.parseState(rawState, abi),
    };
  },
  // fetchState helper => move to utils
  parseState(rawState: NodeState, abi: Artifact) {
    const immFields: { name: string; type: FieldType }[] = [];
    const mutFields: { name: string; type: FieldType }[] = [];
    for (let i = 0; i < abi.fieldsSig.names.length; i++) {
      if (abi.fieldsSig.isMutable[i]) {
        mutFields.push({
          name: abi.fieldsSig.names[i],
          type: abi.fieldsSig.types[i],
        });
      } else {
        immFields.push({
          name: abi.fieldsSig.names[i],
          type: abi.fieldsSig.types[i],
        });
      }
    }

    const fields = rawState.immFields
      .map((field, idx) => {
        if (field.type !== immFields[idx].type) {
          throw new Error("Parsing Error decoding contract state (immFields)");
        }

        switch (field.type) {
          case "Bool":
            return {
              name: immFields[idx].name,
              type: field.type,
              value: parseValue(field),
            };
          case "ByteVec":
            return {
              name: immFields[idx].name,
              type: field.type,
              value: parseValue(field),
            };
          case "Address":
            return {
              name: immFields[idx].name,
              type: field.type,
              value: parseValue(field),
            };
          case "U256":
            return {
              name: immFields[idx].name,
              type: field.type,
              value: parseValue(field),
            };
        }
      })
      .concat(
        rawState.mutFields.map((field, idx) => {
          if (field.type !== mutFields[idx].type) {
            throw new Error(
              "Parsing Error decoding contract state (mutFields)"
            );
          }

          switch (field.type) {
            case "Bool":
              return {
                name: mutFields[idx].name,
                type: field.type,
                value: parseValue(field),
              };
            case "ByteVec":
              return {
                name: mutFields[idx].name,
                type: field.type,
                value: parseValue(field),
              };
            case "Address":
              return {
                name: mutFields[idx].name,
                type: field.type,
                value: parseValue(field),
              };
            case "U256":
              return {
                name: mutFields[idx].name,
                type: field.type,
                value: parseValue(field),
              };
          }
        })
      );

    const assets = [];

    assets.push({
      address: ALPH_ADDRESS,
      amount: BigInt(rawState.asset.attoAlphAmount),
    });

    if (rawState.asset.tokens?.length) {
      for (const token of rawState.asset.tokens) {
        assets.push({
          address: addressFromTokenId(token.id),
          amount: BigInt(token.amount),
        });
      }
    }

    return {
      fields,
      assets,
    };
  },

  async fetchNftCollectionMetadata(collections: ContractAddress[]) {
    return await explorerService.nfts.collectionMetadata(collections);
  },

  async fetchNonFungibleMetadata(tokens: ContractAddress[]) {
    return await explorerService.nfts.metadata(tokens);
  },

  async getBlocksFromHash(hashes: BlockHash[]): Promise<Block[]> {
    const blocks = [];
    for (const hash of hashes) {
      const block = await nodeService.blockFlow.blockWithEventsFromHash(hash);
      blocks.push(block);
      await wait(100);
    }

    const transactionHashes = blocks
      .filter((b) => b.transactions.some((o) => o.inputs.length)) // only fetch transactions with inputs
      .map((b) => b.blockHash);

    const transactions = await Promise.all(
      transactionHashes.map(async (hash) => {
        // return await transactionLoader.load(hash);
        return await explorerService.block.transactions(hash);
      })
    );

    // console.log({ transactions: transactions.flat() });

    const transactionMap = new Map(
      transactions.flat().map((t) => [t.transactionHash, t])
    );

    for (const block of blocks) {
      for (const tx of block.transactions) {
        if (
          [
            // manually skip orphaned blocks. This should be safe to remove now
            // but needs to be verified
            "4fff51665e47336c941f3941ce71510609b70d8992a3d9fe253b05a15de5c6e6",
            "0d28f5e2ee99f9e5d69bf392fc64c95bdbbed356e8babb83ce2103be1c8f75b9",
            "b8d5506149aab96ef0b2e3641e51a4a30c4472e8eafefa0d6efeb65a9d7b5ed0",
            "aaf4b96cbcb5ba1e9fef9ed043cbd4551d948dd1abac55b07b3971b3ab59cfdc",
            "a7d4be8d089c211d3806f8e5877b5c2de58a1ebd172a1fbaaeb65dd3db8d4adb",
            "9fa84938144a187d01da2ac243d0b7f0a2f8000cef246706134cff6050677c94",
          ].includes(tx.transactionHash) &&
          block.blockHash ===
            "00000000000306722ee145304ec09640853895bcb4c01974d5211019e40dd7f0"
        ) {
          console.log({
            tx,
            transaction: transactionMap.get(tx.transactionHash),
            block: block.blockHash,
          });
          continue;
        }
        if (tx.inputs.length) {
          const found = transactionMap.get(tx.transactionHash);
          if (!found) {
            if (
              [
                "0000000000000220cf2d1a8712510090781205e7684f784fab55a96c2c1f2ca0",
                "0000000000004fb7bc1330cf1e4289ea886b65f12160b0972b4edb55c8110600",
                "0000000000010b719c42d8905ca36c2557b3ab981be1034730e66e3d7748dc00",
                "00000000000082cb8bf9d06fbfc9fecc2c79fb6b5e5128bfe6037fa378fbe6c0",
                "0000000000009dcc2c6538d01fc302aeaafb224bbe389557b5b38bf694652580",
                "000000000000885aa90aa0347e75d7a542e286f6a298946b1f9311ff12519210",
                "0000000000019126f9f47344bd994e0cee07e011239d605678de552ea5e843d0",
                "00000000000306722ee145304ec09640853895bcb4c01974d5211019e40dd7f0",
              ].includes(block.blockHash)
            ) {
              continue;
            }
            missedTransactions.add(tx.transactionHash);
            console.log({
              tx,
              transaction: transactionMap.get(tx.transactionHash),
              block: block.blockHash,
            });
            throw new Error(
              `Missing transaction from explorer, must retry ${
                block.timestamp
              } (${new Date(block.timestamp).toISOString()}) ${
                tx.transactionHash
              }`
            );
          }
          const alphInputs = found.inputs.filter(
            (i) => i.tokenAddress === ALPH_ADDRESS
          );

          if (tx.inputs.length !== alphInputs.length) {
            console.log({
              tx,
              transaction: transactionMap.get(tx.transactionHash),
              block: block.blockHash,
              t: [
                "4fff51665e47336c941f3941ce71510609b70d8992a3d9fe253b05a15de5c6e6",
                "0d28f5e2ee99f9e5d69bf392fc64c95bdbbed356e8babb83ce2103be1c8f75b9",
                "b8d5506149aab96ef0b2e3641e51a4a30c4472e8eafefa0d6efeb65a9d7b5ed0",
                "aaf4b96cbcb5ba1e9fef9ed043cbd4551d948dd1abac55b07b3971b3ab59cfdc",
                "a7d4be8d089c211d3806f8e5877b5c2de58a1ebd172a1fbaaeb65dd3db8d4adb",
                "9fa84938144a187d01da2ac243d0b7f0a2f8000cef246706134cff6050677c94",
              ].includes(tx.transactionHash),
              b:
                block.blockHash ===
                "00000000000306722ee145304ec09640853895bcb4c01974d5211019e40dd7f0",
            });
            missedTransactions.add(tx.transactionHash);
            logger.debug(
              `Missing transaction inputs details, aborting. ${tx.inputs.length} on node, ${alphInputs.length} on explorer`
            );
            throw new Error(
              "Missing transaction inputs from explorer, must retry"
            );
          }
          if (missedTransactions.has(tx.transactionHash)) {
            logger.error(
              `Found previously missed transaction ${tx.transactionHash}`
            );
            missedTransactions.delete(tx.transactionHash);
          }
        }
      }
    }

    return blocks
      .map((b) => {
        return {
          ...b,
          transactions: b.transactions.map((t) => {
            const inputs = transactionMap.get(t.transactionHash)?.inputs ?? [];
            const nodeCount = t.inputs.length;
            const alphInputs = inputs.filter(
              (i) => i.tokenAddress === ALPH_ADDRESS
            );

            if (
              nodeCount !== alphInputs.length &&
              [
                "0000000000000220cf2d1a8712510090781205e7684f784fab55a96c2c1f2ca0",
                "0000000000004fb7bc1330cf1e4289ea886b65f12160b0972b4edb55c8110600",
                "0000000000010b719c42d8905ca36c2557b3ab981be1034730e66e3d7748dc00",
                "00000000000082cb8bf9d06fbfc9fecc2c79fb6b5e5128bfe6037fa378fbe6c0",
                "0000000000009dcc2c6538d01fc302aeaafb224bbe389557b5b38bf694652580",
                "000000000000885aa90aa0347e75d7a542e286f6a298946b1f9311ff12519210",
                "0000000000019126f9f47344bd994e0cee07e011239d605678de552ea5e843d0",
                "00000000000306722ee145304ec09640853895bcb4c01974d5211019e40dd7f0",
              ].includes(b.blockHash)
            ) {
              return {
                transactionHash: "",
                gasAmount: 0n,
                gasPrice: 0n,
                events: [],
                inputs: [],
                outputs: [],
              };
            }
            if (nodeCount !== alphInputs.length) {
              throw new Error(
                `Missing transaction inputs details, aborting. ${t.inputs.length} on node, ${inputs.length} on explorer`
              );
            }
            return {
              transactionHash: t.transactionHash,
              gasAmount: t.gasAmount,
              gasPrice: t.gasPrice,
              events: t.events,
              inputs,
              outputs: t.outputs ?? [],
            };
          }),
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  },

  async getBlocksFromTimestamp(from: number, to = from + 1): Promise<Block[]> {
    if (to - from > MAX_DURATION) {
      throw new Error(
        `Cannot fetch more than 30 minutes of blocks. from: ${from} => to: ${to}`
      );
    }
    if (to <= from) {
      throw new Error(
        `has to fetch at least 1 second of blocks. from: ${from} => to: ${to}`
      );
    }

    // TODO: improve loader, most plugins are out of time by ~1ms which breaks this cache
    // should group together - i.e. one starts at timestamp 1700000000000 and another 1700000000001

    logger.info("block fetching starting");
    const blocks = await basicBlockDataLoader.load(`${from}-${to}`);

    const hashes = blocks
      .flat()
      .filter((b) => b.transactions.some((o) => o.inputs.length)) // only fetch transactions with inputs
      .map((b) => b.blockHash);
    logger.info(`block fetching complete - ${hashes.length} blocks found`);

    logger.info("transaction fetching starting");
    const transactions = await Promise.all(
      hashes.map(async (hash) => {
        return await transactionLoader.load(hash);
        // return await explorerService.block.transactions(hash);
      })
    );
    logger.info(
      `transaction fetching complete - ${transactions.length} transactions found`
    );

    const transactionMap = new Map(
      transactions.flat().map((t) => [t.transactionHash, t])
    );

    const flatBlocks = blocks.flat();
    for (const block of flatBlocks) {
      for (const tx of block.transactions) {
        if (tx.inputs.length) {
          const found = transactionMap.get(tx.transactionHash);
          if (!found) {
            missedTransactions.add(tx.transactionHash);
            throw new Error(
              `Missing transaction from explorer, must retry ${
                block.timestamp
              } (${new Date(block.timestamp).toISOString()}) ${
                tx.transactionHash
              }`
            );
          }
          const alphInputs = found.inputs.filter(
            (i) => i.tokenAddress === ALPH_ADDRESS
          );

          if (tx.inputs.length !== alphInputs.length) {
            missedTransactions.add(tx.transactionHash);
            logger.debug(
              `Missing transaction inputs details, aborting. ${tx.inputs.length} on node, ${alphInputs.length} on explorer`
            );
            throw new Error(
              "Missing transaction inputs from explorer, must retry"
            );
          }
          if (missedTransactions.has(tx.transactionHash)) {
            logger.error(
              `Found previously missed transaction ${tx.transactionHash}`
            );
            missedTransactions.delete(tx.transactionHash);
          }
        }
      }
    }

    return flatBlocks
      .map((b) => {
        return {
          ...b,
          transactions: b.transactions.map((t) => {
            const inputs = transactionMap.get(t.transactionHash)?.inputs ?? [];
            const nodeCount = t.inputs.length;
            const alphInputs = inputs.filter(
              (i) => i.tokenAddress === ALPH_ADDRESS
            );
            if (nodeCount !== alphInputs.length) {
              throw new Error(
                `Missing transaction inputs details, aborting. ${t.inputs.length} on node, ${inputs.length} on explorer`
              );
            }
            return {
              transactionHash: t.transactionHash,
              gasAmount: t.gasAmount,
              gasPrice: t.gasPrice,
              events: t.events,
              inputs,
              outputs: t.outputs ?? [],
            };
          }),
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  },
};
