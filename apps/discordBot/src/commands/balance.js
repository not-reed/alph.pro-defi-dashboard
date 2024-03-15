//Shows available commands
const { commaFormat } = require("../core/helpers.js");

const { SlashCommandBuilder } = require("@discordjs/builders");
const messageDisplay = require("../core/messageDisplay.js");

// Discord data to set command
const discordData = new SlashCommandBuilder()
  .setName("balance")
  .setDescription(
    "Shows user's balances, if you don't provide address, it pulls your address from https://alph.pro"
  )
  .addStringOption((option) =>
    option
      .setName("symbol")
      .setDescription(
        "Provide token symbol if you just want balance of that token."
      )
  )
  .addStringOption((option) =>
    option
      .setName("address")
      .setDescription("Provide address that you want to check balances of.")
  );

// Callback for discord
const execute = async (interaction) => {
  await balance(interaction);
};

module.exports = { discordData, execute };

//Command function
async function balance(interaction) {
  let userAddress = interaction.options.getString("address");
  let tokenSymbol = interaction.options.getString("symbol");
  if (!userAddress) {
    //Pull address from Indexer
    let getUserAddress = await fetch(
      `https://indexer.alph.pro/api/bot/primary-address?discordId=${interaction.user.id}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.ALPHDOTPRO_AUTH_TOKEN}`,
        },
      }
    ).then((a) => a.json());

    if (!getUserAddress.address) {
      await messageDisplay.notSuccess(
        interaction,
        "No Address",
        `You did not provide any address to check balance of, and you don't have any address on Alph.pro. Please to go to https://alph.pro/ and conect the wallet.`,
        true
      );
      return;
    } else {
      userAddress = getUserAddress.address;
    }
  }

  const userBalances =
    await fetch(`https://indexer.alph.pro/api/balances?address=${userAddress}
  `).then((a) => a.json());

  if (userBalances.balances.length < 1) {
    await messageDisplay.notSuccess(
      interaction,
      "No Balance",
      `You do not have any balance on address ${userAddress}`,
      true
    );
    return;
  }
  let tokenOrNft;
  let messageBalances = "";
  if (tokenSymbol) {
    const tokenFound = userBalances.balances.find(
      (t) => t.token && t.token.symbol === tokenSymbol.toUpperCase()
    );
    if (tokenFound) {
      messageBalances = `${messageBalances} ${
        tokenFound.token.symbol
      } : ${await commaFormat(
        tokenFound.balance / 10 ** Number(tokenFound.token.decimals)
      )}
    `;
    } else {
      await messageDisplay.notSuccess(
        interaction,
        "No Balance",
        `You do not have any ${tokenSymbol.toUpperCase()} balance on address ${userAddress}`,
        true
      );
      return;
    }
  } else {
    for (const element of userBalances.balances) {
      if (element.nft == null) {
        tokenOrNft = element.token.symbol;

        messageBalances = `${messageBalances} ${tokenOrNft} : ${await commaFormat(
          element.balance / 10 ** Number(element.token.decimals)
        )}\n`;
      } else {
        tokenOrNft = element.nft.name;
        messageBalances = `${messageBalances} ${tokenOrNft} : ${element.balance}\n`;
      }
    }
  }

  await messageDisplay.success(interaction, "Balances", messageBalances, true);
}
