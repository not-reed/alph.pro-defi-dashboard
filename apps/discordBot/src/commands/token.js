//Shows token Info
const { SlashCommandBuilder } = require("@discordjs/builders");

const { success, notSuccess } = require("../core/messageDisplay.js");
const { commaFormat, eighteenDigits } = require("../core/helpers.js");

// Discord data to set command
const discordData = new SlashCommandBuilder()
  .setName("token")
  .setDescription("Displays token info")
  .addStringOption((option) =>
    option
      .setName("symbol_address")
      .setDescription("Pick either Token Symbol or Token Address")
      .setRequired(true)
      .addChoices(
        { name: "Symbol", value: "symbol" },
        { name: "Address", value: "address" }
      )
  )
  .addStringOption((option) =>
    option
      .setName("value")
      .setDescription(
        "Provide Token Symbol or address depending on your previous selection"
      )
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
  const value = interaction.options.getString("value");

  let tokenAddress;
  let tokenSymbol;

  if (symbolOrAddress === "symbol") {
    const getTokenSymbol = await fetch(
      `https://indexer.alph.pro/api/tokens/symbol/${value}`
    ).then((a) => a.json());

    if (getTokenSymbol.tokens.length === 0) {
      await notSuccess(
        interaction,
        "No Token",
        `Token ${value.toUpperCase()} does not exist. `,
        true
      );
      return;
    }
    tokenSymbol = value;
    tokenAddress = getTokenSymbol.tokens[0].address;
  } else if (symbolOrAddress === "address") {
    if (value.length < 10) {
      await notSuccess(
        interaction,
        "To Short",
        "Token address must contain at least 10 characters.",
        true
      );
      return;
    }
    const getTokenSymbol =
      await fetch(`https://indexer.alph.pro/api/prices?address=${value}
              `).then((a) => a.json());
    if (getTokenSymbol.prices.length === 0) {
      await notSuccess(
        interaction,
        "Invalid Token",
        `${value} is not a valid token address. `,
        true
      );
      return;
    }
    tokenSymbol = getTokenSymbol.prices[0].token.symbol;
    tokenAddress = value;
  }

  let tokenInfo =
    await fetch(`https://indexer.alph.pro/api/prices?address=${tokenAddress}
`).then((a) => a.json());

  tokenInfo = tokenInfo.prices[0];

  const tokenHolder = await fetch(
    `https://indexer.alph.pro/api/tokens/holders/${tokenAddress}`
  ).then((a) => a.json());

  const circulatingSupply =
    tokenHolder.holders[0].circulatingSupply / 10 ** tokenInfo.token.decimals;

  const messageTokenInfo = `Name: ${tokenInfo.token.name}
Symbol: ${tokenInfo.token.symbol}
Decimals: ${tokenInfo.token.decimals}

Price: $${
    tokenInfo.markets.length > 1
      ? await commaFormat(await eighteenDigits(tokenInfo.price))
      : "Not Available"
  }
LP: $${
    tokenInfo.markets.length > 1
      ? await commaFormat(await eighteenDigits(tokenInfo.markets[0].liquidity))
      : "Not Available"
  } 
MC: $${
    tokenInfo.markets.length > 1
      ? await commaFormat(
          await eighteenDigits(circulatingSupply * tokenInfo.price)
        )
      : "Not Available"
  }

Circulating Supply: ${await commaFormat(circulatingSupply)}
Holders: ${await commaFormat(tokenHolder.holders[0].holderCount)}

Website:
Discord:
Twitter:
Verified: ${tokenInfo.token.verified}
     `;
  await success(
    interaction,
    `${tokenInfo.token.symbol}`,
    messageTokenInfo,
    false,
    tokenInfo.token.logo
  );
}
