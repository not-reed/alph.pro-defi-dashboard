require("dotenv").config({ path: "../.env" });
const { Client, GatewayIntentBits } = require("discord.js");

const discordClient = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

module.exports = {
	discordClient: discordClient,
};
require("./discord/discordHandler.js");
const { updatePrice } = require("./autoFunctions/priceDisplay.js");

//Run every minute to update token price by renaming channel
setInterval(async () => {
	try {
		await updatePrice();
	} catch (err) {
		console.log("Error update token price ", err.message);
	}
}, 60000);
