import { Plugin } from "../common/plugins/abstract";
import type Database from "../database/schemas/Database";
import type { Transaction } from "kysely";

import type { Block } from "../services/sdk/types/block";
import type { TokenBalance } from "../services/common/types/token";
import { db } from "../database/db";
import type { NewBalance } from "../database/schemas/public/Balance";
import type { NewPluginBlock } from "../database/schemas/public/PluginBlock";
import type {
  BlockHash,
  TransactionHash,
} from "../services/common/types/brands";
import { logger } from "../services/logger";

interface PluginData {
  balances: NewBalance[];
  transactions: NewPluginBlock[];
}

function createBalance(balance: TokenBalance) {
  return {
    userAddress: balance.userAddress,
    tokenAddress: balance.tokenAddress,
    balance: 0n,
  } satisfies NewBalance;
}

export class BalancesPlugin extends Plugin<PluginData> {
  PLUGIN_NAME = "balances";

  async process(blocks: Block[]) {
    const processedTransactions = new Set<TransactionHash>();
    const inputsArr: TokenBalance[] = [];
    const outputsArr: TokenBalance[] = [];

    for (const block of blocks) {
      for (const transaction of block.transactions) {
        if (transaction.inputs.length || transaction.outputs.length) {
          processedTransactions.add(transaction.transactionHash);
          inputsArr.push(...transaction.inputs);
          outputsArr.push(...transaction.outputs);
        }
      }
    }

    const userBalanceKeys = new Map<string, Omit<TokenBalance, "amount">>(
      inputsArr.concat(outputsArr).map((item) => [
        `${item.userAddress}-${item.tokenAddress}`,
        {
          userAddress: item.userAddress,
          tokenAddress: item.tokenAddress,
        } as Omit<TokenBalance, "amount">,
      ])
    );

    if (!userBalanceKeys.size) {
      return { transactions: [], balances: [] };
    }
    const balances: NewBalance[] = await db
      .selectFrom("Balance")
      .selectAll()
      .where((eb) => {
        return eb.or(
          Array.from(userBalanceKeys.values()).map((balance) => {
            return eb.and([
              eb("userAddress", "=", balance.userAddress),
              eb("tokenAddress", "=", balance.tokenAddress),
            ]);
          })
        );
      })
      .execute();

    const balanceMap = new Map(
      balances.map((b) => [`${b.userAddress}-${b.tokenAddress}`, b])
    );

    for (const input of inputsArr) {
      const key = `${input.userAddress}-${input.tokenAddress}`;
      const balance: NewBalance = balanceMap.get(key) ?? createBalance(input);
      balance.balance -= input.amount;
      balanceMap.set(key, balance);
    }

    for (const input of outputsArr) {
      const key = `${input.userAddress}-${input.tokenAddress}`;
      const balance: NewBalance = balanceMap.get(key) ?? createBalance(input);
      balance.balance += input.amount;
      balanceMap.set(key, balance);
    }

    // // on LP create, load token0, token1, pair, factory
    return {
      balances: Array.from(balanceMap.values()),
      transactions: Array.from(processedTransactions).map((hash) => ({
        blockHash: hash,
        pluginName: this.PLUGIN_NAME,
      })),
    };
  }

  // insert data
  async insert(trx: Transaction<Database>, data: PluginData) {
    if (!data.balances?.length) {
      logger.warn("No balances to insert, but had block balances...");
      return;
    }

    await trx
      .insertInto("PluginBlock")
      .values(data.transactions) // throw on conflict
      .execute();

    await trx
      .insertInto("Balance")
      .values(data.balances)
      .onConflict((col) => col.doNothing())
      .execute();

    return;
  }
}
