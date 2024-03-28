import type { Block } from "../services/sdk/types/block";

import type { NewBlock } from "../database/schemas/public/Block";
import { Plugin } from "../common/plugins/abstract";
import type Database from "../database/schemas/Database";
import type { Transaction } from "kysely";
import type { TransactionHash } from "../services/common/types/brands";
import type { NewPluginBlock } from "../database/schemas/public/PluginBlock";

interface PluginData {
  blocks: NewBlock[];
  transactions: NewPluginBlock[];
}

export class BlocksPlugin extends Plugin<PluginData> {
  PLUGIN_NAME = "blocks";

  async process(blocks: Block[]) {
    const pluginData: PluginData = { blocks: [], transactions: [] };
    for (const block of blocks) {
      pluginData.blocks.push({
        hash: block.blockHash,
        height: BigInt(block.height),
        timestamp: new Date(block.timestamp),
        chainFrom: block.chainFrom,
        chainTo: block.chainTo,
        transactionCount: block.transactions.length,
      } satisfies NewBlock);

      for (const tx of block.transactions) {
        // won't be saved by this plugin as its unnecessary amounts of data
        // however, still needs to be added to the array so the core indexer
        // doesn't see it as 'empty' due to no processed transactions
        pluginData.transactions.push({
          blockHash: tx.transactionHash,
          pluginName: this.PLUGIN_NAME,
        });
      }
    }
    return pluginData;
  }

  // insert data
  async insert(trx: Transaction<Database>, data: PluginData) {
    const { blocks } = data;
    await trx
      .insertInto("Block")
      .values(blocks)
      .onConflict((col) => col.doNothing())
      .execute();
  }
}
