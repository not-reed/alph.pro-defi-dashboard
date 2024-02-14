import type { Block } from "../services/common/types/blocks";

import type { NewBlock } from "../database/schemas/public/Block";
import { Plugin } from "../common/plugins/abstract";
import type Database from "../database/schemas/Database";
import type { Transaction } from "kysely";

export class BlocksPlugin extends Plugin<NewBlock[]> {
	PLUGIN_NAME = "blocks";

	async process(blocks: Block[]) {
		return blocks.map((block) => {
			return {
				hash: block.blockHash,
				height: BigInt(block.height),
				timestamp: new Date(block.timestamp),
				chainFrom: block.chainFrom,
				chainTo: block.chainTo,
				transactionCount: block.transactions.length,
			} satisfies NewBlock;
		});
	}

	// insert data
	async insert(trx: Transaction<Database>, blocks: NewBlock[]) {
		await trx
			.insertInto("Block")
			.values(blocks)
			.onConflict((col) => col.doNothing())
			.execute();
	}
}
