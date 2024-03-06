import type { Block } from "../services/sdk/types/block";

import { Plugin } from "../common/plugins/abstract";
import type Database from "../database/schemas/Database";
import type { Transaction } from "kysely";
import type { NewToken } from "../database/schemas/public/Token";
import { db } from "../database/db";
import { addressFromContractId } from "@alephium/web3";
import type { ContractAddress } from "../services/common/types/brands";
import { logger } from "../services/logger";
import explorerService from "../services/explorer";
import { ALPH_ADDRESS } from "../core/constants";

// little flag to include alph every run at startup
let hasAlph = false;

// missing
// - tx1Uck1idLzfyjAbyqrFkNWrxz1MfKCV5FELnJdtbVUs
// - 26j4viXkBzJd5SaDtQzyGM6joqoECmajncT4QS3tmT9hb

const skipped = new Set<ContractAddress>([
	// "tx1Uck1idLzfyjAbyqrFkNWrxz1MfKCV5FELnJdtbVUs" as ContractAddress,
]);

export class TokenPlugin extends Plugin<NewToken[]> {
	PLUGIN_NAME = "tokens";

	// process data to prepare for inserts
	// return data to be saved.
	// whatever is returned here will be passed to the insert function
	async process(blocks: Block[]): Promise<NewToken[]> {
		logger.info("GOT TO PROCESS TOKEN");
		const tokenAddresses = new Set<ContractAddress>();
		for (const block of blocks) {
			for (const transaction of block.transactions) {
				for (const token of transaction.outputs) {
					// don't track alph
					if (
						token.tokenAddress !== ALPH_ADDRESS &&
						!skipped.has(token.tokenAddress)
					) {
						tokenAddresses.add(token.tokenAddress);
					}
				}
			}
		}

		logger.info(`FOUND TOKENS: ${tokenAddresses.size}`);
		if (tokenAddresses.size === 0 && hasAlph) {
			return [];
		}

		const newTokens = new Map<string, NewToken>();

		if (tokenAddresses.size > 0) {
			const found = await db
				.selectFrom("Token")
				.selectAll()
				.where("address", "in", Array.from(tokenAddresses))
				.execute();

			const foundSet = new Set(found.map((token) => token.address));
			const missingSet = new Set(
				Array.from(tokenAddresses).filter((a) => !foundSet.has(a)),
			);
			if (!missingSet.size) {
				return [];
			}

			// fungible tokens
			const tokenMetadata = await this.loadFungibleMetadata(missingSet);
			for (const meta of tokenMetadata) {
				const address = addressFromContractId(meta.id);
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
				verified: true,
				logo: "https://www.ayin.app/assets/alephium-2142ce63.svg",
			} as NewToken);
		}
		return Array.from(newTokens.values());
	}

	// insert data
	async insert(trx: Transaction<Database>, tokens: NewToken[]) {
		if (!tokens?.length) {
			return;
		}
		await trx
			.insertInto("Token")
			.values(tokens)
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
