import chalk from "chalk";
import { autoLoadPluginsFromFolder } from "../core/utils";
import sdk from "../services/sdk";
import { db } from "../database/db";
import { GENESIS_TS, MAX_DURATION } from "../core/constants";
import { findPlugins } from "../database/services/plugin";

const rawPlugins = await autoLoadPluginsFromFolder();
const pluginState = await findPlugins();
const plugins = rawPlugins.map((plugin) => {
  return {
    plugin,
    state: pluginState.find((state) => state.name === plugin.PLUGIN_NAME),
  };
});

function getPlugin(pluginName: string) {
  const _plugin = plugins.find((p) => p.plugin.PLUGIN_NAME === pluginName);
  if (!_plugin) {
    console.error(`Plugin ${pluginName} not found`);
    process.exit(1);
  }

  if (!_plugin.state) {
    console.warn(
      chalk.yellow(`\nPlugin State ${pluginName} not found in database\n`)
    );
  }
  return _plugin;
}
export async function listPlugins() {
  console.log(`
${chalk.bold(chalk.green("Plugins"))}
${plugins
  .map((p) => {
    const diff = Date.now() - (p.state?.timestamp.getTime() || GENESIS_TS);
    const minutes = Math.floor(diff / 1000 / 60);
    const seconds = Math.floor((diff / 1000) % 60);
    const color = minutes < 5 ? chalk.green : chalk.red;
    return ` - ${chalk.green(p.plugin.PLUGIN_NAME)} (Active) ${color(
      minutes === 0 ? "00" : `${minutes.toString().padStart(2, "0")}`
    )}:${color(
      seconds === 0 ? "" : `${seconds.toString().padStart(2, "00")}`
    )} behind`;
  })
  .join("\n")}`);
}

export async function processPlugin(
  pluginName: string,
  start: number,
  end: number,
  save: boolean
) {
  const _plugin = getPlugin(pluginName);

  if (save) {
    console.warn(
      chalk.yellow("\nSave is enabled. Database will be modified\n")
    );
  }

  const startTsFallback = _plugin.state
    ? Math.max(_plugin.state.timestamp.getTime() - MAX_DURATION, GENESIS_TS)
    : GENESIS_TS;

  const _start = start || (end ? end - MAX_DURATION : startTsFallback);
  const _end = end || _start + 1;

  const blocks = await sdk.getBlocksFromTimestamp(_start, _end);

  const data = await _plugin.plugin.process(blocks);

  console.log({
    timestamps: {
      start: new Date(_start).toLocaleString(),
      end: new Date(_end).toLocaleString(),
    },
    time: { start: _start, end: _end },
  });
  console.log(data);

  if (save) {
    await db.transaction().execute(async (trx) => {
      await _plugin.plugin.insert(trx, data);
      // don't update plugin checkpoint here
      // as it will be updated by indexer, and this is a one-off
    });
  }
}

export async function processBlocks(
  pluginName: string,
  blocks: Awaited<ReturnType<typeof sdk.getBlocksFromTimestamp>>,
  save: boolean
) {
  const _plugin = getPlugin(pluginName);

  const data = await _plugin.plugin.process(blocks);

  if (save) {
    await db.transaction().execute(async (trx) => {
      await _plugin.plugin.insert(trx, data);
      // don't update plugin checkpoint here
      // as it will be updated by indexer, and this is a one-off
    });
  }

  return data;
}
