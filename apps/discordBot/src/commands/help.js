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
  const messageHelp = `/token : Shows token Info/Price>
  /lp : Shows LP of two tokens, and $ value`;
  await messageDisplay.success(interaction, "Available Commands", messageHelp);
}
