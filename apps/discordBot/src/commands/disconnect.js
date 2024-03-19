//Disconnects WalletConnect connection
const { SlashCommandBuilder } = require("@discordjs/builders");
const messageDisplay = require("../core/messageDisplay.js");

// Discord data to set command
const discordData = new SlashCommandBuilder()
  .setName("disconnect")
  .setDescription("Disconnects from active WalletConnect connection");

const { wrappedConnect, providerMap } = require("../core/walletConnect.js");

// Callback for discord
const execute = async (interaction) => {
  await disconnect(interaction);
};

module.exports = { discordData, execute };

//Command function
async function disconnect(interaction) {
  const provider = await wrappedConnect(interaction);
  if (provider) {
    providerMap.delete(interaction.user.id);
    provider.disconnect();
    await messageDisplay.success(
      interaction,
      "Disconnect",
      "Successfully disconnected from active WalletConnect connection.",
      true
    );
  } else {
    await messageDisplay.notSuccess(
      interaction,
      "Disconnect",
      `You don't have an active WalletConnect connection.`,
      true
    );
  }
}
