require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");

const discordClient = new Client({
  intents: [GatewayIntentBits.Guilds],
});

module.exports = {
  discordClient: discordClient,
};
require("./discord/discordHandler.js");
