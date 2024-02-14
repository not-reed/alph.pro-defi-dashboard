import type { Block } from "../services/common/types/blocks";

import type { NewBlock } from "../database/schemas/public/Block";
import { Plugin } from "../common/plugins/abstract";
import type Database from "../database/schemas/Database";
import type { Transaction } from "kysely";
import type { NewToken } from "../database/schemas/public/Token";
import { db } from "../database/db";
import { binToHex, contractIdFromAddress } from "@alephium/web3";
import { config } from "../config";

const ALPH_ADDRESS = "tgx7VNFoP9DJiFMFgXXtafQZkUvyEdDHT9ryamHJYrjq";

// little flag to include alph every run at startup
let hasAlph = false;

export class TokenPlugin extends Plugin<NewToken> {
	PLUGIN_NAME = "tokens";

	// process data to prepare for inserts
	// return data to be saved.
	// whatever is returned here will be passed to the insert function
	async process(blocks: Block[]): Promise<NewToken[]> {
		const tokenAddresses = new Set<string>();
		for (const block of blocks) {
			for (const transaction of block.transactions) {
				for (const token of transaction.outputs) {
					// console.log({ process: token });
					// don't track alph
					if (token.tokenAddress !== ALPH_ADDRESS) {
						tokenAddresses.add(token.tokenAddress);
					}
				}
			}
		}

		if (
			tokenAddresses.size === 1 &&
			hasAlph &&
			tokenAddresses.has(ALPH_ADDRESS)
		) {
			console.log("skipping alph only");
			return [];
		}

		if (tokenAddresses.size === 0 && hasAlph) {
			// console.log("Aborting now tokens");
			return [];
		}
		console.log("has tokens");
		console.log({ tokenAddresses });

		const newTokens = new Map<string, NewToken>();
		if (tokenAddresses.size > 0) {
			const found = await db
				.selectFrom("Token")
				.selectAll()
				.where("address", "in", Array.from(tokenAddresses))
				.execute();

			console.log({ found, tokenAddresses });

			const foundSet = new Set(found.map((token) => token.address));
			const missingSet = new Set([]);

			const metadata = await fetch(
				`${config.EXPLORER_URL}/tokens/fungible-metadata`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(
						Array.from(missingSet).map((a) =>
							binToHex(contractIdFromAddress(a)),
						),
					),
				},
			).then((a) => a.json());

			console.log({ metadata });

			for (const address of tokenAddresses) {
				if (!foundSet.has(address) && address !== ALPH_ADDRESS) {
					const id = binToHex(contractIdFromAddress(address));
					const meta = metadata.find((a: unknown) => {
						if (a && typeof a === "object" && "id" in a) {
							return a.id === id;
						}
					});
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

		if (!hasAlph) {
			newTokens.set(ALPH_ADDRESS, {
				address: ALPH_ADDRESS,
				symbol: "ALPH",
				name: "Alephium",
				decimals: 18,
				totalSupply: BigInt(0),
			} as NewToken);
			hasAlph = true;
		}

		// fetch existing ones from database
		// load name,symbol,decimals for missing/new tokens
		// filter out NFT's
		// load total supply for all incase it changed since last event
		// return all tokens to be saved

		// if (newTokens.size === 0) {
		console.log({ newTokens });
		return Array.from(newTokens.values());
	}

	// insert data
	async insert(trx: Transaction<Database>, tokens: NewToken[]) {
		await trx
			.insertInto("Token")
			.values(tokens)
			.onConflict((col) => col.doNothing())
			.execute();
	}
}
