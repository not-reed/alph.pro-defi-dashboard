import type { Block } from "../services/sdk/types/block";

import { Plugin } from "../common/plugins/abstract";
import type Database from "../database/schemas/Database";
import type { Transaction } from "kysely";
import type { NewToken } from "../database/schemas/public/Token";
import { db } from "../database/db";
import { binToHex, contractIdFromAddress } from "@alephium/web3";
import { config } from "../config";
import type { ContractAddress } from "../services/common/types/brands";
import { logger } from "../services/logger";
import explorerService from "../services/explorer";

const ALPH_ADDRESS =
	"tgx7VNFoP9DJiFMFgXXtafQZkUvyEdDHT9ryamHJYrjq" as ContractAddress;

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

	// graphql = {
	// 	tables: ["Token"],
	// 	resolvers: {
	// 		tokens: async (ctx) => await db.selectFrom("Token").selectAll().execute(),
	// 	},
	// };

	// process data to prepare for inserts
	// return data to be saved.
	// whatever is returned here will be passed to the insert function
	async process(blocks: Block[]): Promise<NewToken[]> {
		logger.info("GOT TO PROCESS TOKEN")
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
		logger.info(`FOUND TOKENS: ${tokenAddresses.size}`)
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

			const metadata = await this.loadMetadata(missingSet);

			for (const address of tokenAddresses) {
				if (!foundSet.has(address) && address !== ALPH_ADDRESS) {
					const id = binToHex(contractIdFromAddress(address));
					const meta = metadata.find((a: unknown) => {
						if (a && typeof a === "object" && "id" in a) {
							return a.id === id;
						}
					});

					if (meta) {
						newTokens.set(address, {
							address: address,
							symbol: meta.symbol,
							name: meta.name,
							decimals: Number(meta.decimals),
							totalSupply: BigInt(0),
						} as NewToken);
					}
				}
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

	private async loadMetadata(tokens: Set<ContractAddress>) {
		return await explorerService.tokens.fungibleMetadata(Array.from(tokens))
		// const chunks = Array.from(tokens).reduce((all, one, i) => {
		// 	const ch = Math.floor(i / 80);
		// 	if (all[ch]) {
		// 		all[ch].push(one);
		// 		return all;
		// 	}

		// 	all[ch] = [one];
		// 	return all;
		// }, [] as string[][]);

		// const results = await Promise.all(
		// 	chunks.map(async (chunk) => {
		// 		// TODO: would be much better to get onchain
		// 		return await fetch(`${config.EXPLORER_URL}/tokens/fungible-metadata`, {
		// 			method: "POST",
		// 			headers: {
		// 				accept: "application/json",
		// 				"Content-Type": "application/json",
		// 			},
		// 			body: JSON.stringify(
		// 				chunk.map((a) => binToHex(contractIdFromAddress(a))),
		// 			),
		// 		}).then((a) => a.json());
		// 	}),
		// );

		// interface RawMetadata {
		// 	id: string;
		// 	symbol: string;
		// 	name: string;
		// 	decimals: string;
		// }

		// return results
		// 	.flat()
		// 	.filter((a): a is RawMetadata =>
		// 		Boolean(
		// 			a &&
		// 				typeof a === "object" &&
		// 				"id" in a &&
		// 				"symbol" in a &&
		// 				"name" in a &&
		// 				"decimals" in a,
		// 		),
		// 	) satisfies RawMetadata[];
	}
}
