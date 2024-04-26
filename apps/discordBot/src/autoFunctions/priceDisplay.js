//It updates token prices by renaming channel

const { ChannelType, PermissionFlagsBits } = require("discord.js");

const { discordClient } = require("../index");
const { commaFormat, eighteenDigits } = require("../core/helpers.js");

export async function updatePrice() {
	const guildId = "1178544084764332084"; //Duck server
	const categoryId = "1233409710145667144"; //Prices

	// const guildId = "1199089919235207248"; //Alph Base test
	// const categoryId = "1233147512559239200"; //Prices

	try {
		const guild = await discordClient.guilds.fetch(guildId);
		const categoryChannelsArray = [
			...(await guild.channels.fetch()).values(),
		].filter(
			(channel) =>
				channel.parentId === categoryId &&
				channel.type === ChannelType.GuildVoice,
		);

		const tokenPrices = await fetch(
			"https://indexer.alph.pro/api/prices?address=tgx7VNFoP9DJiFMFgXXtafQZkUvyEdDHT9ryamHJYrjq,xUTp3RXGJ1fJpCGqsAY6GgyfRQ3WQ1MdcYR1SiwndAbR,vP6XSUyjmgWCB2B9tD5Rqun56WJqDdExWnfwZVEqzhQb,2AJhBUKKaubukxfYx5S1hmmSohcBGWuDAikMhQCtsPyBm,utDzMDHq8fygNzqZjCgRjhJbj1Rew14ExohxngeRKA1D",
		).then((a) => a.json());

		try {
			tokenPrices.prices.forEach(async (tokenPrice, index) => {
				if (categoryChannelsArray.length > index) {
					const channel = categoryChannelsArray[index];
					const newName = `${tokenPrice.token.symbol.toUpperCase()}: $${await commaFormat(
						await eighteenDigits(tokenPrice.price),
					)}`;
					await channel.setName(newName);
				} else {
					// If no channel exists, create a new voice channel
					const newName = `${tokenPrice.token.symbol.toUpperCase()}: $${await commaFormat(
						await eighteenDigits(tokenPrice.price),
					)}`;
					await guild.channels.create({
						name: newName,
						type: ChannelType.GuildVoice,
						parent: categoryId,
					});
				}
			});
		} catch (err) {
			console.log("Error handling channels: ", err.message);
		}
	} catch (error) {
		console.error("Error fetching category or channels:", error);
	}
}
