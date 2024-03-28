import { argv, chalk } from "zx";
import { db } from "../database/db";
import pkg from "../../package.json";
import { listPlugins, processPlugin } from "./plugin";
import { runSeeder } from "./seeder";
import {
  backfillDeadRare,
  findUnprocessedNfts,
  processCollection,
} from "./nfts";
import type { ContractAddress } from "../services/common/types/brands";
import { fixBalances } from "./balances";
import { fillAyinPools } from "./ayin-pools";
import { getAyinPrices } from "./ayin-prices";
import { binToHex, contractIdFromAddress } from "@alephium/web3";

switch (argv._[0]) {
  case "help":
    console.log(`

${chalk.cyan("Alph.Pro")} Indexer CLI
Version: ${pkg.version}

Commands:
    - ${chalk.green("help")}            => view all available commands
    - ${chalk.green("seed")}            => seed database with dummy fake data
    - ${chalk.green(
      "nft"
    )}             => process a collection to fill offchain data
    - ${chalk.green("plugins")}         => inspect and check plugins
        - ${chalk.yellow("list")}        => list all plugins
            i.e. bun cli plugins list
        - ${chalk.yellow("process")}     => process a plugin
            <pluginName> <start?> <end?> [--save]
            i.e. bun cli plugins process balances 1707962340000

`);
    break;
  case "plugins":
    switch (argv._[1]) {
      case "list":
        await listPlugins();
        break;
      case "process":
        await processPlugin(
          argv._[2],
          Number(argv.start || 0),
          Number(argv.end || 0),
          Boolean(argv.save)
        );
        break;
    }
    break;
  case "nft":
    await processCollection(argv._[1] as ContractAddress, Boolean(argv.force));
    break;
  case "convert":
    if (argv.address) {
      console.log(binToHex(contractIdFromAddress(argv.address)));
    } else if (argv.id) {
      console.log(contractIdFromAddress(argv.id));
    }
    break;

  case "nft:deadrare":
    await backfillDeadRare();
    break;
  case "nft:search":
    await findUnprocessedNfts();
    break;
  case "fix:prices":
    await getAyinPrices();
    break;
  case "fix:pools":
    await fillAyinPools();
    break;
  case "fix:balances":
    await fixBalances({
      user: argv.user,
      token: argv.token,
      min: Number(argv.min || 0),
      max: Number(argv.max || 0),
      minBalance: BigInt(argv.minBalance || 0),
      maxBalance: BigInt(argv.maxBalance || 0),
      force: Boolean(argv.force),
    });
    break;
  case "seed":
    await runSeeder();
    break;
  default:
    console.log(chalk.red("\nCommand not found\n"));
}

// close connection
await db.destroy();
console.log();
process.exit(0);
