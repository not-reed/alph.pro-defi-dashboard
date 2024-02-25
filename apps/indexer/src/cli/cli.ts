import { argv, chalk } from "zx";
import { db } from "../database/db";
import pkg from "../../package.json";
import { listPlugins, processPlugin } from "./plugin";
import { runSeeder } from "./seeder";
import { findUnprocessedNfts, processCollection } from "./nfts";
import type { ContractAddress } from "../services/common/types/brands";

switch (argv._[0]) {
	case "help":
		console.log(`

${chalk.cyan("Alph.Pro")} Indexer CLI
Version: ${pkg.version}

Commands:
    - ${chalk.green("help")}            => view all available commands
    - ${chalk.green("seed")}            => seed database with dummy fake data
    - ${chalk.green("nft")}             => process a collection to fill offchain data
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
					Boolean(argv.save),
				);
				break;
		}
		break;
	case "nft":
		await processCollection(argv._[1] as ContractAddress);
		break;

	case "nft:search":
		await findUnprocessedNfts();
		break;
	case "seed":
		await runSeeder();
		break;
	default:
		console.log(chalk.red("\nCommand not found\n"));
}

// close connection
await db.destroy();
