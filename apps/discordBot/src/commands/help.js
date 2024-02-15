const { SlashCommandBuilder } = require("@discordjs/builders");
const messageDisplay = require("../core/messageDisplay.js");

// Discord data to set command
const discordData = new SlashCommandBuilder()
  .setName("help")
  .setDescription("This is Help");

// Callback for discord
const execute = async (interaction) => {
  await help(interaction);
};

module.exports = { discordData, execute };

//Command function
async function help(interaction) {
  await messageDisplay.success(interaction, "Help", "I am here to help you.");
}
