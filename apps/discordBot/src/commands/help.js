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

//Command function
async function help(interaction) {
  const messageHelp = `/node : Shows node info
/token : Shows token's Info>
/tip : Tip token/NFT to user/address
/give: Give Vending Machine food to user
/grab: Mint Vending Machine food
/balance: Displays users balance`
// /lp : Shows LP of two tokens, and $ value`;
  await messageDisplay.success(
    interaction,
    "Available Commands",
    messageHelp,
    false
  );
}
