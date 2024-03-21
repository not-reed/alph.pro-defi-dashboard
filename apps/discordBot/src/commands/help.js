//Shows available commands
const { SlashCommandBuilder } = require("@discordjs/builders");
const messageDisplay = require("../core/messageDisplay.js");

// Discord data to set command
const discordData = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Shows all the available commands");

// Callback for discord
const execute = async (interaction) => {
  await help(interaction);
};

module.exports = { discordData, execute };

const maxLengthForPadding = 8

//Command function
async function help(interaction) {
  const messageHelp = `\`\`\`/${"node".padEnd(maxLengthForPadding)}: Shows node info
/${"token".padEnd(maxLengthForPadding)}: Shows token's Info
/${"nft".padEnd(maxLengthForPadding)}: Shows NFT/Collection Info
/${"top".padEnd(maxLengthForPadding)}: Shows top list
/${"tip".padEnd(maxLengthForPadding)}: Tip token/NFT to user/address
/${"give".padEnd(maxLengthForPadding)}: Give Vending Machine food to user
/${"grab".padEnd(maxLengthForPadding)}: Mint Vending Machine food
/${"balance".padEnd(maxLengthForPadding)}: Displays users balance\`\`\``;
  // /lp : Shows LP of two tokens, and $ value`;
  await messageDisplay.success(
    interaction,
    "Available Commands",
    messageHelp,
    false
  );
}
