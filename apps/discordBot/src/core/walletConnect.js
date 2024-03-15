const {
  EmbedBuilder,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const QRCode = require("qrcode");
const { WalletConnectProvider } = require("@alephium/walletconnect-provider");

const messageDisplay = require("../core/messageDisplay.js");

const WALLET_CONNECT_PROJECT_ID = "6e2562e43678dd68a9070a62b6d52207";

export const providerMap = new Map();

export const wrappedConnect = (interaction) =>
  new Promise(async (resolve, reject) => {
    try {
      const commandUsed = interaction.client.commands.get(
        interaction.commandName
      );

      if (commandUsed) {
        if (commandUsed.discordData.name == "disconnect") {
          return resolve(providerMap.get(interaction.user.id));
        }
      }

      if (providerMap.has(interaction.user.id)) {
        return resolve(providerMap.get(interaction.user.id));
      }

      const provider = await WalletConnectProvider.init({
        addressGroup: 0,
        networkId: process.env.NETWORK,
        onDisconnected: () => {},
        projectId: WALLET_CONNECT_PROJECT_ID,
      });
      provider.on("displayUri", async (uri) => {
        try {
          const qrCodeDataURL = await QRCode.toDataURL(uri);
          const buffer = Buffer.from(qrCodeDataURL.split(",")[1], "base64");
          const attachment = new AttachmentBuilder(buffer, {
            name: "walletconnect-qr.png",
          });

          const messageEmbed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle("Wallet Connect")
            .setDescription(
              "Scan the barcode using Alephium mobile wallet or click the button to open the wallet"
            )
            .setImage(`attachment://walletconnect-qr.png`);

          // Create a new button
          const button = new ButtonBuilder()
            .setLabel("Connect")
            .setStyle(ButtonStyle.Link)
            .setURL(`https://indexer.alph.pro/wc?uri=${uri}`);

          // Create an action row to hold the button
          const row = new ActionRowBuilder().addComponents(button);

          // Reply to the interaction with the button
          if (interaction.deferred || interaction.replied) {
            await interaction.followUp({
              embeds: [messageEmbed],
              components: [row],
              files: [attachment],
              ephemeral: true,
            });
          } else {
            await interaction.reply({
              embeds: [messageEmbed],
              components: [row],
              files: [attachment],
              ephemeral: true,
            });
          }
        } catch (err) {
          await messageDisplay.notSuccess(
            interaction,
            "Error",
            err.message,
            true
          );

          console.log(err);
        }
      });
      await provider.connect();
      providerMap.set(interaction.user.id, provider);
      resolve(provider);
    } catch (err) {
      await messageDisplay.notSuccess(interaction, "Error", err.message, true);
      console.log(err);
    }
  });
