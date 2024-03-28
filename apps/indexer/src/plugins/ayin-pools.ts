// NGU: '21nj6sBTtQfTwCErYAHF3CNBaDRAc1E1Q3aUCcbsuG8mu
// http://10.11.12.13:9090/contracts/21nj6sBTtQfTwCErYAHF3CNBaDRAc1E1Q3aUCcbsuG8mu/parent
// http://10.11.12.13:9090/contract-events/contract-address/21nj6sBTtQfTwCErYAHF3CNBaDRAc1E1Q3aUCcbsuG8mu?page=1&limit=100
// Ayin Factory: 'vyrkJHG49TXss6pGAz2dVxq5o7mBXNNXAV18nAeqVT1R'
// http://10.11.12.13:9090/contracts/vyrkJHG49TXss6pGAz2dVxq5o7mBXNNXAV18nAeqVT1R/sub-contracts?page=1&limit=100
// http://10.11.12.13:9090/contract-events/contract-address/vyrkJHG49TXss6pGAz2dVxq5o7mBXNNXAV18nAeqVT1R?page=1&limit=100
import type { Block } from "../services/sdk/types/block";

import { Plugin } from "../common/plugins/abstract";
import type Database from "../database/schemas/Database";
import type { Transaction } from "kysely";
import type { NewPool } from "../database/schemas/public/Pool";
import { addressFromContractId } from "@alephium/web3";
import type {
  ContractAddress,
  TransactionHash,
} from "../services/common/types/brands";
import type { NewPluginBlock } from "../database/schemas/public/PluginBlock";

const AYIN_FACTORY = "vyrkJHG49TXss6pGAz2dVxq5o7mBXNNXAV18nAeqVT1R";

interface PluginData {
  pools: NewPool[];
  transactions: NewPluginBlock[];
}

export class AyinPoolsPlugin extends Plugin<PluginData> {
  PLUGIN_NAME = "ayin-pools";

  async process(blocks: Block[]) {
    const pools = new Map<string, NewPool>();
    const processedTransactions = new Set<TransactionHash>();

    for (const block of blocks) {
      for (const transaction of block.transactions) {
        for (const event of transaction.events) {
          if (
            event.contractAddress === AYIN_FACTORY &&
            event.eventIndex === 0
          ) {
            processedTransactions.add(transaction.transactionHash);
            const [token0, token1, pair] = event.fields.map(
              (field) => field.value
            );
            const pool = {
              token0: addressFromContractId(token0 as string),
              token1: addressFromContractId(token1 as string),
              pair: addressFromContractId(pair as string),
              factory: event.contractAddress,
            } satisfies NewPool;

            pools.set(pool.pair, pool);
          }
        }
      }
    }

    // // on LP create, load token0, token1, pair, factory
    return {
      pools: Array.from(pools.values()),
      transactions: Array.from(processedTransactions).map((hash) => ({
        blockHash: hash,
        pluginName: this.PLUGIN_NAME,
      })),
    };
  }

  // insert data
  async insert(trx: Transaction<Database>, data: PluginData) {
    await trx
      .insertInto("PluginBlock")
      .values(data.transactions) // throw on conflict
      .execute();

    await trx
      .insertInto("Pool")
      .values(data.pools)
      .onConflict((col) => col.doNothing())
      .execute();
    return;
  }
}
