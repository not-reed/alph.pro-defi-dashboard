//Shows top list based on different categories
const { SlashCommandBuilder } = require("@discordjs/builders");
const { success, notSuccess } = require("../core/messageDisplay.js");
const { commaFormat } = require("../core/helpers.js");

// Discord data to set command
const discordData = new SlashCommandBuilder()
  .setName("top")
  .setDescription("Shows top list based on category")
  .addSubcommand((subcommand) =>
    subcommand.setName("token").setDescription("Shows Top Token list")
  )
  .addSubcommand((subcommand) =>
    subcommand.setName("nft").setDescription("Shows Top NFT list")
  )
  .addSubcommand((subcommand) =>
    subcommand.setName("holders").setDescription("Shows TOP Token Holders list")
  );

// Callback for discord
const execute = async (interaction) => {
  await top(interaction);
};

module.exports = { discordData, execute };

const maxLengthForPadding = 6;

//Command function
async function top(interaction) {
  await interaction.deferReply();
  if (interaction.options.getSubcommand() === "token") {
    const getTokensHolder = await fetch(
      "https://indexer.alph.pro/api/tokens/holders"
    ).then((a) => a.json());

    const verifiedTokens = getTokensHolder.holders.filter(
      (element) => element.token.verified
    );
    const tokensMarketCap = [];
    for (const element of verifiedTokens) {
      const getTokenSymbol = await fetch(
        `https://indexer.alph.pro/api/tokens/symbol/${element.token.symbol}`
      ).then((a) => a.json());
      const tokenAddress = getTokenSymbol.tokens[0].address;
      const getTokenPrice =
        await fetch(`https://indexer.alph.pro/api/prices?address=${tokenAddress}
                  `).then((a) => a.json());
      const marketCap =
        (element.circulatingSupply / 10 ** element.token.decimals) *
        (getTokenPrice.prices[0].price / 10 ** 18);

      const highestLiquidity = getTokenPrice.prices[0].markets.reduce(
        (max, market) => {
          const maxLiquidity = BigInt(max.liquidity ?? 0);
          const marketLiquidity = BigInt(market.liquidity ?? 0);
          return marketLiquidity > maxLiquidity ? market : max;
        },
        getTokenPrice.prices[0].markets[0] || { liquidity: "0" }
      );

      tokensMarketCap.push({
        symbol: element.token.symbol,
        marketCap: Number(marketCap),
        liquidity: Number(highestLiquidity.liquidity / 10 ** 18),
      });
    }

    tokensMarketCap.sort((a, b) => {
      return b.marketCap - a.marketCap;
    });

    tokensMarketCap.sort((a, b) => {
      return b.liquidity - a.liquidity;
    });

    const top10Tokens = tokensMarketCap.slice(0, 10);

    let messageTopTokens = "```";
    messageTopTokens += "Symbol     MC      LP\n--------------------------\n";
    for (const token of top10Tokens) {
      messageTopTokens += `${token.symbol.padEnd(
        maxLengthForPadding
      )}: ${await commaFormat(token.marketCap).padEnd(8)}: ${await commaFormat(
        token.liquidity
      )} \n`;
    }
    messageTopTokens += "```";

    await success(interaction, "Top Tokens", messageTopTokens, false);
  } else if (interaction.options.getSubcommand() === "nft") {
    await success(
      interaction,
      "Top NFT based on Volume",
      "```NFT price comming soon```",
      false
    );
  } else if (interaction.options.getSubcommand() === "holders") {
    const getHolders = await fetch(
      " https://indexer.alph.pro/api/tokens/holders"
    ).then((a) => a.json());
    const verifiedTokens = getHolders.holders.filter(
      (element) => element.token.verified
    );

    let messageHolders = "```";

    messageHolders += "Symbol  Holders\n----------------\n";
    let topCount = 1;
    for (const holder of verifiedTokens) {
      messageHolders += `${holder.token.symbol.padEnd(
        maxLengthForPadding
      )}: ${await commaFormat(holder.holderCount)}\n`;
      topCount++;
      if (topCount === 10) {
        break;
      }
    }
    messageHolders += "```";
    await success(interaction, "Top Holders", messageHolders, false);
  }
}
