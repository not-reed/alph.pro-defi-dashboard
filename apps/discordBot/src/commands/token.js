//Shows token Info and price
const { SlashCommandBuilder } = require("@discordjs/builders");
const messageDisplay = require("../core/messageDisplay.js");

// Discord data to set command
const discordData = new SlashCommandBuilder()
  .setName("token")
  .setDescription("Displays token info and price")
  .addStringOption((option) =>
    option
      .setName("price_info")
      .setDescription("Provide the option")
      .setRequired(true)
      .addChoices(
        { name: "Price", value: "price" },
        { name: "Info", value: "info" }
      )
  )
  .addStringOption((option) =>
    option
      .setName("symbol_address")
      .setDescription("Provide the option")
      .setRequired(true)
      .addChoices(
        { name: "Address", value: "address" },
        { name: "Symbol", value: "symbol" }
      )
  )
  .addStringOption((option) =>
    option
      .setName("value")
      .setDescription("Provide Token Symbol or address")
      .setRequired(true)
  );

// Callback for discord
const execute = async (interaction) => {
  await token(interaction);
};

module.exports = { discordData, execute };

//Command function
async function token(interaction) {
  const symbolOrAddress = interaction.options.getString("symbol_address");
  const priceOrInfo = interaction.options.getString("price_info");
  const value = interaction.options.getString("value");
  if (priceOrInfo == "price") {
    let messageTokenPrice;
    if (symbolOrAddress == "symbol") {
      let tokenSymbol = await fetch(
        `https://indexer.alph.pro/api/tokens/symbol/${value}`
      ).then((a) => a.json());
      tokenSymbol = tokenSymbol.tokens[0].address;
      const tokenInfo =
        await fetch(`https://indexer.alph.pro/api/prices?address=${tokenSymbol}
    `).then((a) => a.json());

      messageTokenPrice = `Price: ${tokenInfo.prices[0].price}`;
      await messageDisplay.success(
        interaction,
        `${tokenInfo.prices[0].token.symbol}`,
        messageTokenPrice
      );
    } else {
      const tokenInfo =
        await fetch(`https://indexer.alph.pro/api/prices?address=${value}
      `).then((a) => a.json());

      messageTokenPrice = `Price: ${tokenInfo.prices[0].price}`;
      await messageDisplay.success(
        interaction,
        `${tokenInfo.prices[0].token.symbol}`,
        messageTokenPrice
      );
    }
  } else {
    //Token info
    if (symbolOrAddress == "symbol") {
      let tokenSymbol = await fetch(
        `https://indexer.alph.pro/api/tokens/symbol/${value}`
      ).then((a) => a.json());
      tokenSymbol = tokenSymbol.tokens[0].address;
      let tokenHolder = await fetch(
        `https://indexer.alph.pro/api/tokens/holders/${tokenSymbol}`
      ).then((a) => a.json());
      let tokenInfo = await fetch(
        `https://indexer.alph.pro/api/tokens/address/${tokenSymbol}`
      ).then((a) => a.json());
      tokenInfo = tokenInfo.tokens[0];
      messageTokenInfo = `Name: ${tokenInfo.name}
      Symbol: ${tokenInfo.symbol}
      Decimals: ${tokenInfo.decimals}
      Holders: ${tokenHolder.holders[0].holderCount}
      website:
      discord:
      twitter:
      Verified: ${tokenInfo.verified}   
     `;
      await messageDisplay.success(
        interaction,
        `${tokenInfo.symbol}`,
        messageTokenInfo
      );
    } else {
      let tokenHolder = await fetch(
        `https://indexer.alph.pro/api/tokens/holders/${value}`
      ).then((a) => a.json());
      let tokenInfo = await fetch(
        `https://indexer.alph.pro/api/tokens/address/${value}`
      ).then((a) => a.json());
      tokenInfo = tokenInfo.tokens[0];
      messageTokenInfo = `Name: ${tokenInfo.name}
      Symbol: ${tokenInfo.symbol}
      Decimals: ${tokenInfo.decimals}
      Holders: ${tokenHolder.holders[0].holderCount}
      website:
      discord:
      twitter:
      Verified: ${tokenInfo.verified}   
     `;
      await messageDisplay.success(
        interaction,
        `${tokenInfo.symbol}`,
        messageTokenInfo
      );
    }
  }
}
