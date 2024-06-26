import cron from "node-cron";
import { logger } from "../services/logger";
import { addressFromContractId } from "@alephium/web3";
import { db } from "../database/db";

import { toString as parseCron } from "cronstrue";
import { EVERY_30_MINUTES } from "../core/constants";
import { config } from "../config";
import { findTokensByAddress, updateToken } from "../database/services/token";

const GITHUB_URL =
  "https://raw.githubusercontent.com/alephium/token-list/master/tokens/mainnet.json";

/**
 * Fetches the official listed token list from @alephium github
 * and updates any missing/changed metadata every 30 minutes
 */
export async function startTokensTask() {
  if (config.INDEXING_DISABLED) {
    logger.info("Tokens Task Disabled: Skipping");
    return;
  }

  const schedule = EVERY_30_MINUTES;

  logger.info(`Starting Tokens Task: ${parseCron(schedule)}`);

  cron.schedule(
    schedule,
    async () => {
      const results: unknown = await fetch(GITHUB_URL).then((a) => a.json());

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
        new Set<string>(results.tokens.map((token) => token.id))
      );
      const tokenListAddresses = tokenListIds.map(addressFromContractId);
      const tokens = await findTokensByAddress(tokenListAddresses);

      if (tokens.length !== tokenListIds.length) {
        logger.warn(
          `Github Token List Count Mismatch. Github: ${tokenListIds.length}, Local: ${tokens.length}`
        );
      }

      for (const token of tokens) {
        const meta = results.tokens.find(
          (t) => addressFromContractId(t.id) === token.address
        );

        if (!meta) {
          continue;
        }
        token.listed = true;
        token.description = meta.description;
        token.logo = meta.logoURI;
      }

      const previouslyListed = await db.selectFrom("Token")
        .selectAll()
        .where("listed", "=", true)
        .where('Token.address', 'not in', tokenListAddresses)
        .execute();

      await db.transaction().execute(async (trx) => {
        if (previouslyListed.length) {
          await trx.updateTable("Token")
            .set({ listed: false })
            .where("id", 'in', previouslyListed.map(a => a.id))
            .execute();
        }
        for (const token of tokens) {
          await updateToken(token, trx);
        }
      });

      logger.info("Github Token List Updated");
    },
    { runOnInit: false } // handy flag once to initialize
  );
}
