import cron from "node-cron";
import { logger } from "../services/logger";
import { addressFromContractId } from "@alephium/web3";
import { db } from "../database/db";
import { EVERY_30_MINUTES } from "./schedules";
import { toString as parseCron } from "cronstrue";

const GITHUB_URL =
	"https://raw.githubusercontent.com/alephium/token-list/master/tokens/mainnet.json";

/**
 * Fetches the official verified token list from @alephium github
 * and updates any missing/changed metadata every 30 minutes
 */
export async function startTokensTask() {
	const schedule = EVERY_30_MINUTES;

	logger.info(`Starting Tokens Task: ${parseCron(schedule)}`);

	cron.schedule(
		schedule,
		async () => {
			const results = await fetch(GITHUB_URL).then((a) => a.json());

			if (
				!results ||
				typeof results !== "object" ||
				!("tokens" in results) ||
				!Array.isArray(results.tokens)
			) {
				logger.error("Invalid token list from github");
				return;
			}

			const tokenListIds = Array.from(
				new Set<string>(results.tokens.map((token) => token.id)),
			);
			const tokenListAddresses = tokenListIds.map(addressFromContractId);
			const tokens = await db
				.selectFrom("Token")
				.selectAll()
				.where("address", "in", tokenListAddresses)
				.execute();

			if (tokens.length !== tokenListIds.length) {
				logger.warn(
					`Github Token List Count Mismatch. Github: ${tokenListIds.length}, Local: ${tokens.length}`,
				);
			}

			for (const token of tokens) {
				const meta = results.tokens.find(
					(t) => addressFromContractId(t.id) === token.address,
				);

				if (!meta) {
					continue;
				}
				token.verified = true;
				token.description = meta.description;
				token.logo = meta.logoURI;
			}

			await db.transaction().execute(async (trx) => {
				for (const token of tokens) {
					await trx
						.updateTable("Token")
						.set(token)
						.where("id", "=", token.id)
						.execute();
				}
			});

			logger.info("Github Token List Updated");
		},
		{ runOnInit: false }, // handy flag once to initialize
	);
}
