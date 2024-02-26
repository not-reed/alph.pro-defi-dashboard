//Shows LP of two Tokens and $value of LP amounts
const { SlashCommandBuilder } = require("@discordjs/builders");
const messageDisplay = require("../core/messageDisplay.js");

// Discord data to set command
const discordData = new SlashCommandBuilder()
  .setName("lp")
  .setDescription("Displays LP price")
  .addStringOption((option) =>
    option
      .setName("first_token")
      .setDescription("Provide First Token Symbol")
      .setRequired(true)
  )

  .addStringOption((option) =>
    option
      .setName("second_token")
      .setDescription("Provide Second Token Symbol")
      .setRequired(true)
  )

  .addNumberOption((option) =>
    option.setName("lp_amount").setDescription("Provide LP amount")
  );

// Callback for discord
const execute = async (interaction) => {
  await lp(interaction);
};

module.exports = { discordData, execute };

//Command function
async function lp(interaction) {
  const first_token = interaction.options.getString("first_token");
  const second_token = interaction.options.getString("second_token");

  const lp_amount = interaction.options.getNumber("lp_amount") ?? "NoLpAmount";

  if (lp_amount == "NoLpAmount") {
    await messageDisplay.success(
      interaction,
      `${first_token} ${second_token} LP`,
      "Coming Soon"
    );
  } else {
    await messageDisplay.success(
      interaction,
      `${first_token} ${second_token} LP`,
      "Coming Soon"
    );
  }
}
