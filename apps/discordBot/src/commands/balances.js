//Shows available commands
const { SlashCommandBuilder } = require("@discordjs/builders");
const messageDisplay = require("../core/messageDisplay.js");

// Discord data to set command
const discordData = new SlashCommandBuilder()
  .setName("balances")
  .setDescription("Shows user's balances")

  .addStringOption((option) =>
    option
      .setName("address")
      .setDescription("Provide address")
      .setRequired(true)
  );

// Callback for discord
const execute = async (interaction) => {
  await balances(interaction);
};

module.exports = { discordData, execute };

//Command function
async function balances(interaction) {
  let messageBalances = "";
  const userAddress = interaction.options.getString("address");
  const userBalances =
    await fetch(`https://indexer.alph.pro/api/balances?address=${userAddress}
  `).then((a) => a.json());

  let tokenOrNft;
  userBalances.balances.forEach((element) => {
    if (element.nft == null) {
      tokenOrNft = element.token.symbol;
    } else {
      tokenOrNft = element.nft.name;
    }
    messageBalances = `${messageBalances} ${tokenOrNft} : ${element.balance}\n`;
  });
  await messageDisplay.success(interaction, `Balances`, messageBalances);
}
