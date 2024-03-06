require("dotenv").config({ path: "../.env" });
const { Client, GatewayIntentBits } = require("discord.js");

const discordClient = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

module.exports = {
  discordClient: discordClient,
};
require("./discord/discordHandler.js");
