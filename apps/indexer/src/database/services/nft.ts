import { sql, type Transaction } from "kysely";
import type { NftUpdate } from "../schemas/public/Nft";
import type PublicSchema from "../schemas/public/PublicSchema";
import { db } from "../db";

export async function bulkUpdateNft(
	nfts: NftUpdate[],
	trx: Transaction<PublicSchema>,
) {
	return await trx
		.updateTable("Nft")
		.from(values(nfts, "c"))
		.set((eb) => ({
			address: eb.ref("c.address"),
			uri: eb.ref("c.uri"),
		}))
		.whereRef("Nft.collectionAddress", "=", "c.collectionAddress")
		.where((ab) => sql<boolean>`"Nft"."nftIndex" = c."nftIndex"::numeric`)
		.returningAll()
		.execute();
}

export async function findNftOrTokenAddresses(addresses: string[]) {
	return await db
		.selectFrom("Nft")
		.union(
			// filter out found tokens also
			db
				.selectFrom("Token")
				.select("address")
				.where("address", "in", addresses),
		)
		.select("address")
		.where("address", "in", addresses)
		.execute();
}

//kysely bulk update helper
function values<R extends Record<string, unknown>, A extends string>(
	records: R[],
	alias: A,
) {
	// Assume there's at least one record and all records
	// have the same keys.
	const keys = Object.keys(records[0]);

	// Transform the records into a list of lists such as
	// ($1, $2, $3), ($4, $5, $6)
	const values = sql.join(
		records.map((r) => sql`(${sql.join(keys.map((k) => r[k]))})`),
	);

	// Create the alias `v(id, v1, v2)` that specifies the table alias
	// AND a name for each column.
	const wrappedAlias = sql.ref(alias);
	const wrappedColumns = sql.join(keys.map(sql.ref));
	const aliasSql = sql`${wrappedAlias}(${wrappedColumns})`;

	// Finally create a single `AliasedRawBuilder` instance of the
	// whole thing. Note that we need to explicitly specify
	// the alias type using `.as<A>` because we are using a
	// raw sql snippet as the alias.
	return sql<R>`(values ${values})`.as<A>(aliasSql);
}
