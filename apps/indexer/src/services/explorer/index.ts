import { binToHex, contractIdFromAddress } from "@alephium/web3";
import { config } from "../../config";
import type {
  BlockHash,
  ContractAddress,
  TransactionHash,
  UserAddress,
} from "../common/types/brands";
import type { ContractEvent } from "../node/types/events";

import type { ExplorerTransaction } from "./types/transactions";

import { mapRawInputToTokenBalance } from "../common/utils/token";
import { transformField } from "../common/types/fields";
import { logger } from "../logger";
import type { CollectionMetadata } from "./types/nfts";
import { chunkArray } from "../../utils/arrays";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const headers: Record<string, string> = {
  Accept: "application/json",
  "Content-Type": "application/json",
};

if (config.EXPLORER_BASIC_AUTH) {
  headers.Authorization = `Basic ${config.EXPLORER_BASIC_AUTH}`;
}

async function getPaginatedResults(
  url: string,
  page = 1,
  limit = 100,
  retries = 0
): Promise<unknown[]> {
  try {
    logger.debug(`Fetching transactions for ${url} => page ${page}`);
    const response = await fetch(`${url}?limit=${limit}&page=${page}`, {
      headers,
    });
    const results: unknown = await response.json();

    if (!results || !Array.isArray(results)) {
      throw new Error("Invalid results");
    }

    if (results.length === limit) {
      const y: unknown = await getPaginatedResults(url, page + 1, limit, 0);
      return results.concat(y);
    }

    return results;
  } catch (err) {
    if (retries < 3) {
      await wait(250);
      logger.warn(`Retrying ${url} page ${page} after error`, err);
      return await getPaginatedResults(url, page, limit, retries + 1);
    }
    throw err;
  }
}
export default {
  tokens: {
    fungibleMetadata: async (contractAddresses: ContractAddress[]) => {
      const chunks = contractAddresses.reduce((all, one, i) => {
        const ch = Math.floor(i / 80);
        if (all[ch]) {
          all[ch].push(one);
          return all;
        }

        all[ch] = [one];
        return all;
      }, [] as ContractAddress[][]);

      const results = await Promise.all(
        chunks.map(async (chunk) => {
          // TODO: would be much better to get onchain
          return await fetch(
            `${config.EXPLORER_URL}/tokens/fungible-metadata`,
            {
              method: "POST",
              headers: headers,
              body: JSON.stringify(
                chunk.map((a) => binToHex(contractIdFromAddress(a)))
              ),
            }
          ).then((a) => a.json());
        })
      );

      interface RawTokenMetadata {
        id: string;
        symbol: string;
        name: string;
        decimals: string;
      }

      return results
        .flat()
        .filter((a): a is RawTokenMetadata =>
          Boolean(
            a &&
              typeof a === "object" &&
              "id" in a &&
              "symbol" in a &&
              "name" in a &&
              "decimals" in a
          )
        ) satisfies RawTokenMetadata[];
    },
  },
  block: {
    async latest() {
      const { blocks } = await fetch(`${config.EXPLORER_URL}/blocks?limit=1`, {
        headers,
      }).then((a) => a.json());
      const [block] = blocks;
      return block;
    },
    transactions: async (
      blockHash: BlockHash
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
      contractAddress: string
    ): Promise<ContractEvent[]> => {
      // TODO: pagination
      const url = `${config.EXPLORER_URL}/contract-events/contract-address/${contractAddress}?page=1&limit=100`;
      const contractEvents: unknown = await fetch(url, { headers }).then((a) =>
        a.json()
      );

      if (!contractEvents || !Array.isArray(contractEvents)) {
        throw new Error("Invalid contractEvents");
      }

      if (contractEvents.length === 100) {
        throw new Error(
          `The time has come to handle pagination 2- explorer.contractEvents.contractAddress ${url}`
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
  contracts: {
    async fetchHolders(address: ContractAddress): Promise<UserAddress[]> {
      const url = `${config.EXPLORER_URL}/tokens/${binToHex(
        contractIdFromAddress(address)
      )}/addresses`;
      return (await getPaginatedResults(url)) as UserAddress[];
    },
    async fetchSubContracts(
      address: ContractAddress
    ): Promise<ContractAddress[]> {
      const subContracts: ContractAddress[] = [];
      let page = 1;
      const limit = 100;
      do {
        console.log("fetching sub contracts for");
        const subContractResponse: unknown = await fetch(
          `${config.EXPLORER_URL}/contracts/${address}/sub-contracts?limit=${limit}&page=${page}`,
          {
            headers,
          }
        ).then((a) => a.json());
        if (
          !subContractResponse ||
          typeof subContractResponse !== "object" ||
          !("subContracts" in subContractResponse) ||
          !Array.isArray(subContractResponse.subContracts)
        ) {
          throw new Error(
            "Unsupported response - explorer.contracts.fetchSubContracts"
          );
        }

        subContracts.push(...subContractResponse.subContracts);
        page++;
      } while (subContracts.length !== 0 && subContracts.length % limit === 0);

      return subContracts;
    },

    async fetchParentContract(
      address: ContractAddress
    ): Promise<ContractAddress | null> {
      const url = `${config.EXPLORER_URL}/contracts/${address}/parent`;
      const contracts: unknown = await fetch(url, { headers }).then((a) =>
        a.json()
      );

      if (!contracts || typeof contracts !== "object") {
        throw new Error(
          "Unsupported response - explorer.contracts.fetchParentContract"
        );
      }

      if ("detail" in contracts) {
        throw new Error(`Error fetching parent contract: ${contracts.detail}`);
      }

      if (!("parent" in contracts) || !contracts.parent) {
        return null;
      }

      return contracts.parent as ContractAddress;
    },
  },

  nfts: {
    async collectionMetadata(collections: ContractAddress[]) {
      const metadatas: unknown[] = await fetch(
        `${config.EXPLORER_URL}/tokens/nft-collection-metadata`,
        {
          method: "POST",
          headers: headers,
          body: JSON.stringify(collections),
        }
      ).then((a) => a.json());

      return metadatas;
    },
    metadata: async (contractAddresses: ContractAddress[]) => {
      const chunks = chunkArray(contractAddresses, 80);
      interface NftMetaData {
        id: string;
        tokenUri: string;
        collectionId: string;
        nftIndex: string;
      }

      const metadata: NftMetaData[] = [];
      for (const chunk of chunks) {
        const data = await fetch(`${config.EXPLORER_URL}/tokens/nft-metadata`, {
          method: "POST",
          headers: headers,
          body: JSON.stringify(
            chunk.map((a) => binToHex(contractIdFromAddress(a)))
          ),
        }).then((a) => a.json());
        metadata.push(...data);
      }

      return metadata;
    },
  },
};
