//Shows available commands
const { discordClient } = require("../index.js");
const { SlashCommandBuilder } = require("@discordjs/builders");

const { wrappedConnect } = require("../core/walletConnect.js");
const {
  web3,
  hexToString,
  DUST_AMOUNT,
  stringToHex,
  ONE_ALPH,
} = require("@alephium/web3");
const config = require("../../../vendingMachine/alephium.config");

const messageDisplay = require("../core/messageDisplay.js");

// Discord data to set command
const discordData = new SlashCommandBuilder()
  .setName("tip")
  .setDescription("Tips Token/NFT to user/address")
  .addStringOption((option) =>
    option
      .setName("token_symbol")
      .setDescription("Provide the token to send")
      .setRequired(true)
  )
  .addNumberOption((option) =>
    option
      .setName("send_amount")
      .setDescription("Provide how much Token to send")
      .setRequired(true)
  )
  .addUserOption((option) =>
    option.setName("user").setDescription("Tag a user @").setRequired(false)
  )
  .addStringOption((option) =>
    option
      .setName("address")
      .setDescription("Provide user's address")
      .setRequired(false)
  );

// Callback for discord
const execute = async (interaction) => {
  await tip(interaction);
};

module.exports = { discordData, execute };

//Command function
async function tip(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });
    const tokenSymbol = interaction.options.getString("token_symbol");

    let getTokenInfo = await fetch(
      `https://indexer.alph.pro/api/tokens/symbol/${tokenSymbol}`
    ).then((a) => a.json());

    if (getTokenInfo.tokens.length == 0) {
      await messageDisplay.notSuccess(
        interaction,
        "No Token",
        `Token ${tokenSymbol} does not exist. `,
        true
      );
      return;
    }

    const tokenId = getTokenInfo.tokens[0].id;

    const multiplier = 10 ** getTokenInfo.tokens[0].decimals;

    let sendAmount = interaction.options.getNumber("send_amount");
    sendAmount = sendAmount * multiplier;

    const userInfo = interaction.options.getUser("user");
    const userAddress = interaction.options.getString("address");
    let receiverAddress;

    if (userInfo) {
      let getUserAddress = await fetch(
        `https://indexer.alph.pro/api/bot/primary-address?discordId=${userInfo.id}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.ALPHDOTPRO_AUTH_TOKEN}`,
          },
        }
      ).then((a) => a.json());

      if (!getUserAddress.address) {
        //If user does not have a address send a message to reciever that needs to connect wallet on Alph.Pro
        discordClient.users.fetch(userInfo.id).then(async (user) => {
          await messageDisplay.notSuccessDM(
            user,
            "No Address",
            `${interaction.user.username} is trying to tip you, but you don't have an address. Please go to https://alph.pro/ and conect your tip wallet.`
          );
        });

        await messageDisplay.notSuccess(
          interaction,
          "No Address",
          `${userInfo.username} does not have an address. Please ask ${userInfo.username} to go to https://alph.pro/ and conect the tip wallet.`,
          true
        );
        return;
      } else {
      }
      receiverAddress = getUserAddress.address;
    } else if (userAddress) {
      receiverAddress = userAddress;
    } else {
      await messageDisplay.notSuccess(
        interaction,
        "Invalid argument",
        "Either you mention user or provide user address.",
        true
      );
      return;
    }

    const provider = await wrappedConnect(interaction);
    web3.setCurrentNodeProvider(
      config.default.networks[process.env.NETWORK].nodeUrl,
      undefined,
      fetch
    );

    //Get user address key
    const senderAddress = provider.account.address;

    const sentTX = await provider.signAndSubmitTransferTx({
      signerAddress: senderAddress,
      destinations: [
        {
          address: receiverAddress,
          attoAlphAmount: 0n,
          tokens: [
            {
              id: tokenId,
              amount: sendAmount,
            },
          ],
        },
      ],
    });
    if (sentTX) {
      await messageDisplay.success(
        interaction,
        "Successfully completed TX",
        sentTX.txId,
        true
      );
      if (userInfo) {
        await messageDisplay.success(
          interaction,
          "Tip sent",
          `${interaction.user.username} tipped ${
            sendAmount / multiplier
          } ${tokenSymbol} to address: ${receiverAddress}`,
          false
        );
      } else {
        await messageDisplay.success(
          interaction,
          "Tip sent",
          `${interaction.user.username} tipped ${
            sendAmount / multiplier
          } ${tokenSymbol} to <@${userInfo.id}>}`,
          false
        );
      }
    }
  } catch (err) {
    await messageDisplay.notSuccess(interaction, "Error", err.message, true);
  }
}
