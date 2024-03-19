const {
  EmbedBuilder,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const QRCode = require("qrcode");
const { WalletConnectProvider } = require("@alephium/walletconnect-provider");

const WALLET_CONNECT_PROJECT_ID = "6e2562e43678dd68a9070a62b6d52207";

export const providerMap = new Map();

export const wrappedConnect = (interaction) => {
  return new Promise((resolve, reject) => {
    const handleAsyncOperations = async () => {
      try {
        const commandUsed = interaction.client.commands.get(
          interaction.commandName
        );

        if (commandUsed && commandUsed.discordData.name === "disconnect") {
          resolve(providerMap.get(interaction.user.id));
          return;
        }

        if (providerMap.has(interaction.user.id)) {
          resolve(providerMap.get(interaction.user.id));
          return;
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
              .setImage("attachment://walletconnect-qr.png");

            const button = new ButtonBuilder()
              .setLabel("Connect")
              .setStyle(ButtonStyle.Link)
              .setURL(`https://indexer.alph.pro/wc?uri=${uri}`);

            const row = new ActionRowBuilder().addComponents(button);

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
            console.log(err);
            reject(err);
          }
        });

        await provider.connect();
        providerMap.set(interaction.user.id, provider);
        resolve(provider);
      } catch (err) {
        console.log(err);
        reject(err);
      }
    };

    handleAsyncOperations();
  });
};
