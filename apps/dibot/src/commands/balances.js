//Shows available commands
const { SlashCommandBuilder } = require("@discordjs/builders");
const messageDisplay = require("../core/messageDisplay.js");

// Discord data to set command
const discordData = new SlashCommandBuilder()
  .setName("balances")
  .setDescription("Shows user's balances")

  .addStringOption((option) =>
    option.setName("token_symbol").setDescription("Provide Token Symbol")
  );

// Callback for discord
const execute = async (interaction) => {
  await balances(interaction);
};

module.exports = { discordData, execute };

//Command function
async function balances(interaction) {
  //Get user balance from API

  const tokenSymbol =
    interaction.options.getString("token_symbol") ?? "noToken";

  if (tokenSymbol == "noToken") {
    await messageDisplay.success(interaction, `Balances`, "Show all balances");
  } else {
    await messageDisplay.success(interaction, `Token`, "Show token balances");
  }
}
