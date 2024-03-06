//Give Vending Machine Food to others
const emoji = require("emoji-dictionary");

const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  EmbedBuilder,
  SlashCommandBuilder,
} = require("discord.js");

const { wrappedConnect, providerMap } = require("../core/walletConnect.js");
const { waitTxConfirmed } = require("@alephium/cli");
const { web3, DUST_AMOUNT, ONE_ALPH } = require("@alephium/web3");
const { Foods, MintNft } = require("../../../vendingMachine/artifacts/ts");
const {
  loadDeployments,
} = require("../../../vendingMachine/artifacts/ts/deployments");
const config = require("../../../vendingMachine/alephium.config");

const messageDisplay = require("../core/messageDisplay.js");

const receiverAddressMap = new Map();

let foods = [
  ["Popcorn", "popcorn"],
  ["Banana", "banana"],
  ["Beer", "beer"],
  ["Bread", "bread"],
  ["Hot Dog", "hotdog"],
  ["Lollipop", "lollipop"],
  ["Milk", "milk"],
  ["Candy", "candy"],
  ["Taco", "taco"],
  ["Cheese", "cheese"],
  ["Chicken", "chicken"],
  ["Soda", "soda"],
  ["Chips", "chips"],
  ["Coffee", "coffee"],
  ["Pie", "pie"],
  ["Donut", "doughnut"],
  ["Eggs", "egg"],
  ["Fries", "fries"],
  ["Hamburger", "hamburger"],
  ["Pizza", "pizza"],
];

// Discord data to set command
const discordData = new SlashCommandBuilder()
  .setName("give")
  .setDescription("Give Vending Machine food to user")
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("Tag a person you want to give food to.")
      .setRequired(true)
  );

// Callback for discord
const execute = async (interaction) => {
  await give(interaction);
};

module.exports = { discordData, execute, menuInteraction };

//Command function
async function give(interaction) {
  try {
    const userInfo = interaction.options.getUser("user");

    let getUserAddress = await fetch(
      `https://indexer.alph.pro/api/bot/primary-address?discordId=${userInfo.id}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.ALPHDOTPRO_AUTH_TOKEN}`,
        },
      }
    ).then((a) => a.json());

    if (!getUserAddress.address) {
      //If user does not have address then send a message to reciever that needs to connect wallet on Alph.Pro
      discordClient.users.fetch(userInfo.id).then(async (user) => {
        await messageDisplay.notSuccessDM(
          user,
          "No Address",
          `${interaction.user.username} is trying to send you food, but you don't have an address. Please go to https://alph.pro/ and conect your tip wallet.`
        );
      });

      await messageDisplay.notSuccess(
        interaction,
        "No Address",
        `${userInfo.username} does not have an address. Please ask ${userInfo.username} to go to https://alph.pro/ and conect the tip wallet.`,
        true
      );
      return;
    }

    receiverAddressMap.set(interaction.user.id, {
      user: userInfo,
      receiverAddress: getUserAddress.address,
    });

    const provider = await wrappedConnect(interaction);
    web3.setCurrentNodeProvider(
      config.default.networks[process.env.NETWORK].nodeUrl,
      undefined,
      fetch
    );
    //Get user address key
    const senderAddress = provider.account.address;

    if (senderAddress == getUserAddress.address) {
      await messageDisplay.notSuccess(
        interaction,
        "Self Give",
        `You can't give food to yourself, find someone else.`,
        true
      );
      return;
    }

    const userBalances =
      await fetch(`https://indexer.alph.pro/api/balances?address=${senderAddress}
    `).then((a) => a.json());

    //Find Vending Machine balances
    const tokenFound = userBalances.balances.filter(
      (t) =>
        t.nft &&
        t.nft.collection &&
        t.nft.collection.address ===
          "22vxm543X8aEkqu31spuRGkaiNyN5hsmWaSP4o3c46tVd"
    );
    if (tokenFound.length < 1) {
      await messageDisplay.notSuccess(
        interaction,
        "No Balance",
        `You do not have any vending machine foods on this address ${senderAddress}`,
        true
      );
      return;
    }

    let options = [];

    for (const element of tokenFound) {
      let foodName = await getFoodRange(element.nft.nftIndex);
      let foodLabel = foodName[0];
      let emojiName = foodName[1];
      options.push(
        new StringSelectMenuOptionBuilder()
          .setLabel(foodLabel)
          .setValue(element.nft.id)
          .setEmoji(emoji.getUnicode(emojiName) || "😋")
      );
    }

    options.push(
      new StringSelectMenuOptionBuilder()
        .setLabel("beer")
        .setValue("beer")
        .setEmoji(emoji.getUnicode("beer") || "😋")
    );

    const foodMenu = new StringSelectMenuBuilder()
      .setCustomId("give")
      .setPlaceholder("Select a Food to Give")
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(foodMenu);

    //change to reply
    await interaction.followUp({
      components: [row],
      ephemeral: true,
    });
  } catch (err) {
    console.log(err);
  }
}

async function menuInteraction(interaction) {
  const provider = providerMap.get(interaction.user.id);

  const selectedFood = interaction.values[0];
  web3.setCurrentNodeProvider(
    config.default.networks[process.env.NETWORK].nodeUrl,
    undefined,
    fetch
  );
  //Get user address key
  const senderAddress = provider.account.address;
  let userInfo = receiverAddressMap.get(interaction.user.id);
  let user = userInfo.user;
  let receiverAddress = userInfo.receiverAddress;
  const sentTX = await provider.signAndSubmitTransferTx({
    signerAddress: senderAddress,
    destinations: [
      {
        address: receiverAddress,
        attoAlphAmount: 0n,
        tokens: [
          {
            id: selectedFood,
            amount: 1,
          },
        ],
      },
    ],
  });

  await messageDisplay.success(
    interaction,
    "In process...",
    `Waiting on TX to be success`,
    true
  );

  await waitTxConfirmed(nodeProvider, sentTX.txId, 1, 1000);
  if (sentTX) {
    await messageDisplay.success(
      interaction,
      "Successfully completed TX",
      sentTX.txId,
      true
    );

    await messageDisplay.success(
      interaction,
      "Food sent",
      `${interaction.user.username} gave food to <@${user.id}>}`,
      false
    );
  }
}

async function getFoodRange(index) {
  if (index < 51) {
    return foods[0];
  } else {
    index = parseInt(index / 50) - 1;
    return foods[index];
  }
}
