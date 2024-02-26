//Shows available commands
const { SlashCommandBuilder } = require("@discordjs/builders");
const { AttachmentBuilder } = require("discord.js");
const QRCode = require("qrcode");
const {
  loadDeployments,
} = require("../../../vendingMachine/artifacts/ts/deployments");
// import { VendingMachine } from "../../../vendingMachine/artifacts/ts";
const messageDisplay = require("../core/messageDisplay.js");

const { web3 } = require("@alephium/web3");
const config = require("../../../vendingMachine/alephium.config");
const { WalletConnectProvider } = require("@alephium/walletconnect-provider");

const WALLET_CONNECT_PROJECT_ID = "6e2562e43678dd68a9070a62b6d52207";

// Discord data to set command
const discordData = new SlashCommandBuilder()
  .setName("tip")
  .setDescription("Tips Token/NFT to user/address")
  .addStringOption((option) =>
    option
      .setName("send_amount")
      .setDescription("Provide how much AlPH to send")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("receiver_address")
      .setDescription("Provide receiver address")
      .setRequired(true)
  );
// Callback for discord
const execute = async (interaction) => {
  await tip(interaction);
};

module.exports = { discordData, execute };

//Command function
async function tip(interaction) {
  const provider = await WalletConnectProvider.init({
    addressGroup: 0,
    networkId: "testnet",
    onDisconnected: () => {},
    projectId: WALLET_CONNECT_PROJECT_ID,
  });

  provider.on("displayUri", async (uri) => {
    const qrCodeDataURL = await QRCode.toDataURL(uri);
    const buffer = Buffer.from(qrCodeDataURL.split(",")[1], "base64");
    const attachment = new AttachmentBuilder(buffer, "walletconnect-qr.png");

    const messageHelp = `Scan above barcorde to connect using Alephium mobile wallet, keep your wallet open, you will get a request to apporve the transaction`;
    await messageDisplay.sendAttachment(
      interaction,
      "Barcode",
      messageHelp,
      attachment
    );
  });

  await provider.connect();

  //>>>>>Clear code later >> this is for alph network
  const network = "testnet";

  const deployments = loadDeployments(network);

  let vendingMachineStates = deployments.contracts.VendingMachine;

  if (!vendingMachineStates) {
    throw new Error("Vending Machine contract not found");
  }

  web3.setCurrentNodeProvider(
    config.default.networks[network].nodeUrl,
    undefined,
    fetch
  );

  const nftInfo =
    await vendingMachineStates.contractInstance.methods.nftByIndex({
      args: { index: 1n },
    });

  const tokenContractAddress = nftInfo.contracts[0].fields.foodsContractId;
  const nftOwner = nftInfo.contracts[0].fields;
  //>>>>>>>>>>>>>>>>>>>>> Clear code above after hack >>>>>>>

  //Get user address/public key
  const userPublicInfo = provider.account;
  const userPublicKey = userPublicInfo.publicKey;
  const userAddress = userPublicInfo.address;

  //
  const receiverAddress = interaction.options.getString("receiver_address");
  let sendAmount = interaction.options.getString("send_amount");
  sendAmount = sendAmount * 10 ** 18;
  //

  provider.signAndSubmitTransferTx({
    signerAddress: userAddress,
    destinations: [{ address: receiverAddress, attoAlphAmount: sendAmount }],
  });
}
