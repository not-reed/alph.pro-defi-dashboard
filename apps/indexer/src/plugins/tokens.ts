import type { Block } from "../services/sdk/types/block";

import { Plugin } from "../common/plugins/abstract";
import type Database from "../database/schemas/Database";
import type { Transaction } from "kysely";
import type { NewToken } from "../database/schemas/public/Token";
import { db } from "../database/db";
import { addressFromContractId } from "@alephium/web3";
import type {
  ContractAddress,
  TransactionHash,
} from "../services/common/types/brands";
import { logger } from "../services/logger";
import explorerService from "../services/explorer";
import { ALPH_ADDRESS } from "../core/constants";
import { findTokenOrNftAddresses } from "../database/services/token";
import type { NewPluginBlock } from "../database/schemas/public/PluginBlock";

// little flag to include alph every run at startup
let hasAlph = false;

// missing
// - tx1Uck1idLzfyjAbyqrFkNWrxz1MfKCV5FELnJdtbVUs
// - 26j4viXkBzJd5SaDtQzyGM6joqoECmajncT4QS3tmT9hb

const skipped = new Set<ContractAddress>([
  // "tx1Uck1idLzfyjAbyqrFkNWrxz1MfKCV5FELnJdtbVUs" as ContractAddress,
]);

interface PluginData {
  tokens: NewToken[];
  transactions: NewPluginBlock[];
}

export class TokenPlugin extends Plugin<PluginData> {
  PLUGIN_NAME = "tokens";

  // process data to prepare for inserts
  // return data to be saved.
  // whatever is returned here will be passed to the insert function
  async process(blocks: Block[]) {
    const tokenAddresses = new Set<ContractAddress>();

    const txHashMapByAddress = new Map<string, string>();

    for (const block of blocks) {
      for (const transaction of block.transactions) {
        for (const token of transaction.outputs) {
          // don't track alph
          if (
            token.tokenAddress !== ALPH_ADDRESS &&
            !skipped.has(token.tokenAddress)
          ) {
            tokenAddresses.add(token.tokenAddress);
            // this will get one transaction, essentially at random
            // every hash would be too much, and for this plugin its not needed
            txHashMapByAddress.set(
              token.tokenAddress,
              transaction.transactionHash
            );
          }
        }
      }
    }

    if (tokenAddresses.size === 0 && hasAlph) {
      return { tokens: [], transactions: [] };
    }

    const newTokens = new Map<string, NewToken>();
    const processedTransactions = new Set<TransactionHash>();

    if (tokenAddresses.size > 0) {
      const found = await findTokenOrNftAddresses(Array.from(tokenAddresses));

      const foundSet = new Set(found.map((token) => token.address));
      const missingSet = new Set(
        Array.from(tokenAddresses).filter((a) => !foundSet.has(a))
      );
      if (!missingSet.size) {
        return { tokens: [], transactions: [] };
      }

      // fungible tokens
      const tokenMetadata = await this.loadFungibleMetadata(missingSet);
      for (const meta of tokenMetadata) {
        const address = addressFromContractId(meta.id);
        processedTransactions.add(
          txHashMapByAddress.get(address as string) as TransactionHash
        );
        newTokens.set(address, {
          address: address,
          symbol: meta.symbol,
          name: meta.name,
          decimals: Number(meta.decimals),
          totalSupply: BigInt(0),
        } satisfies NewToken);
      }
    }

    if (!hasAlph) {
      hasAlph = true;
      newTokens.set(ALPH_ADDRESS, {
        address: ALPH_ADDRESS,
        symbol: "ALPH",
        name: "Alephium",
        decimals: 18,
        totalSupply: BigInt(0),
        listed: true,
        logo: "https://www.ayin.app/assets/alephium-2142ce63.svg",
      } satisfies NewToken);
    }
    return {
      tokens: Array.from(newTokens.values()),
      transactions: Array.from(processedTransactions).map((hash) => ({
        blockHash: hash,
        pluginName: this.PLUGIN_NAME,
      })),
    };
  }

  // insert data
  async insert(trx: Transaction<Database>, data: PluginData) {
    // TODO: don't need to save this, too much data
    // await trx
    // .insertInto("PluginBlock")
    // .values(data.transactions) // throw on conflict
    // .execute();

    await trx
      .insertInto("Token")
      .values(data.tokens)
      .onConflict((col) => col.doNothing())
      .execute();
  }

  private async loadFungibleMetadata(tokens: Set<ContractAddress>) {
    if (!tokens.size) {
      return [];
    }

    return await explorerService.tokens.fungibleMetadata(Array.from(tokens));
  }
}
