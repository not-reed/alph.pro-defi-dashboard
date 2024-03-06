//Mint Vending Machine foods
const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  EmbedBuilder,
  SlashCommandBuilder,
} = require("discord.js");

const emoji = require("emoji-dictionary");

const { wrappedConnect } = require("../core/walletConnect.js");
const { waitTxConfirmed } = require("@alephium/cli");
const { web3, DUST_AMOUNT, ONE_ALPH } = require("@alephium/web3");
const { Foods, MintNft } = require("../../../vendingMachine/artifacts/ts");
const {
  loadDeployments,
} = require("../../../vendingMachine/artifacts/ts/deployments");
const config = require("../../../vendingMachine/alephium.config");

const messageDisplay = require("../core/messageDisplay.js");

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
  .setName("grab")
  .setDescription("Mints Vending Machine foods");

const execute = async (interaction) => {
  await grab(interaction);
};

// Command function
async function grab(interaction) {
  try {
    web3.setCurrentNodeProvider(
      config.default.networks[process.env.NETWORK].nodeUrl,
      undefined,
      fetch
    );

    const deployments = loadDeployments(process.env.NETWORK);

    let vendingMachineStates = deployments.contracts.VendingMachine;

    if (!vendingMachineStates) {
      throw new Error("Vending Machine contract not found");
    }

    let vendingMachineFetch =
      await vendingMachineStates.contractInstance.fetchState();

    const remainingSupply = [];
    for (const i in vendingMachineFetch.fields.mintedFoods) {
      if (
        Number(vendingMachineFetch.fields.mintedFoods[i]) - 50 * Number(i) >
        0
      ) {
        remainingSupply.push(
          50 -
            (Number(vendingMachineFetch.fields.mintedFoods[i]) - 50 * Number(i))
        );
      } else {
        remainingSupply.push(50);
      }
    }

    let options = [];
    for (let i = 0; i < 20; i++) {
      options.push(
        new StringSelectMenuOptionBuilder()
          .setLabel(
            `${foods[i][0]} : ${remainingSupply[i]}/50 ${
              remainingSupply[i] == 0 ? "(Sold Out)" : ""
            }`
          )
          .setValue(`${foods[i][1]}`)
          .setEmoji(emoji.getUnicode(foods[i][1]) || "😋")
      );
    }

    const foodMenu = new StringSelectMenuBuilder()
      .setCustomId("grab")
      .setPlaceholder("Select a Food to Mint")
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(foodMenu);

    await interaction.reply({
      components: [row],
      ephemeral: true,
    });
  } catch (err) {
    console.log(err);
  }
}

async function menuInteraction(interaction) {
  const selectedFood = interaction.values[0];
  let index = foods.findIndex((f) => f[1] === selectedFood);

  await messageDisplay.successUpdate(
    interaction,
    "Minting",
    `You are minting ${foods[index][0]}`,
    true
  );

  web3.setCurrentNodeProvider(
    config.default.networks[process.env.NETWORK].nodeUrl,
    undefined,
    fetch
  );

  const deployments = loadDeployments(process.env.NETWORK);

  let vendingMachineStates = deployments.contracts.VendingMachine;

  if (!vendingMachineStates) {
    throw new Error("Vending Machine contract not found");
  }

  let mintPrice = (
    await vendingMachineStates.contractInstance.methods.getMintPrice()
  ).returns;
  let mintAmount = 1n;

  let alphNeededForMint = mintPrice * mintAmount;
  let alphNeededForSubcontract =
    mintAmount * ONE_ALPH + mintAmount * DUST_AMOUNT;
  let totalAlphNeeded = alphNeededForMint + alphNeededForSubcontract;

  const provider = await wrappedConnect(interaction);

  let newNftCreated = await MintNft.execute(provider, {
    initialFields: {
      vendingMachine: vendingMachineStates.contractInstance.contractId,
      foodTypeId: BigInt(index),
      mintAmount: mintAmount,
    },
    attoAlphAmount: totalAlphNeeded,
  });

  let returnedTransactionId = newNftCreated.txId;

  const nodeProvider = web3.getCurrentNodeProvider();
  await messageDisplay.success(
    interaction,
    "Minting in process...",
    `Waiting on TX to be success`,
    true
  );

  await waitTxConfirmed(nodeProvider, returnedTransactionId, 1, 1000);

  await messageDisplay.success(
    interaction,
    "Food Minted",
    `You have successfully minted ${foods[index][0]} from Vending Machine.\nTX: ${returnedTransactionId} `,
    true
  );
  await messageDisplay.success(
    interaction,
    "Food Minted",
    `${interaction.user.username} successfully Minted ${foods[index][0]} from Vending Machine.`,
    false
  );
}

module.exports = { discordData, execute, menuInteraction };
