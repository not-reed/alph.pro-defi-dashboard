const { SlashCommandBuilder } = require("@discordjs/builders");
const messageDisplay = require("../core/messageDisplay.js");

// Discord data to set command
const discordData = new SlashCommandBuilder()
  .setName("token")
  .setDescription("Displays token info and price")
  .addStringOption(option =>
    option.setName('option')
        .setDescription('Provide the option')
        .setRequired(true)
        .addChoices(
            { name: 'Price', value: 'price' },
            { name: 'Info', value: 'info' }
        ))
        .addStringOption(option => option.setName('symbol')
        .setDescription('Provide Token Symbol')
        .setRequired(true))
// Callback for discord
const execute = async (interaction) => {
  await token(interaction);
};

module.exports = { discordData, execute };

//Command function
async function token(interaction) {
  const tokenSymbol = interaction.options.getString('symbol')
  const priceOrInfo=interaction.options.getString('option')
  if(priceOrInfo=="price"){

    await messageDisplay.success(interaction, "Token Price", 
    `Price:
    MC:
    LP:
    chart:
    buy:`
    );
  }else{

    await messageDisplay.success(interaction, "Token Info", 
    `Name:
    Symbol:
    Decimals:
    Holders:
    website:
    discord:
    twitter:`
    );

  }
}