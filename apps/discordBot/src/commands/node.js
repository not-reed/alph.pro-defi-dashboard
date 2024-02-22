//Shows available commands
const { SlashCommandBuilder } = require("@discordjs/builders");
const messageDisplay = require("../core/messageDisplay.js");

// Discord data to set command
const discordData = new SlashCommandBuilder()
  .setName("node")
  .setDescription("Shows node info");

// Callback for discord
const execute = async (interaction) => {
  await node(interaction);
};

module.exports = { discordData, execute };

//Command function
async function node(interaction) {
  const getBlockHeight = await fetch(
    "https://wallet-v20.mainnet.alephium.org/blockflow/chain-info?fromGroup=0&toGroup=0"
  ).then((a) => a.json());

  const getCurrentHashRate = await fetch(
    "https://wallet-v20.mainnet.alephium.org/infos/current-hashrate"
  ).then((a) => a.json());

  const getDifficuilty = await fetch(
    "https://wallet-v20.mainnet.alephium.org/infos/current-difficulty"
  ).then((a) => a.json());

  const messageNode = `Block Height: ${getBlockHeight.currentHeight}
  Hashrate: ${getCurrentHashRate.hashrate}
  Difficulty: ${getDifficuilty.difficulty}`;
  await messageDisplay.success(interaction, "Node Info", messageNode);
}
