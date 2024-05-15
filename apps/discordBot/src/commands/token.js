//Shows token Info
const { SlashCommandBuilder } = require("@discordjs/builders");

const { success, notSuccess } = require("../core/messageDisplay.js");
const { commaFormat, eighteenDigits } = require("../core/helpers.js");

// Discord data to set command
const discordData = new SlashCommandBuilder()
	.setName("token")
	.setDescription("Displays token info")
	.addSubcommand((subcommand) =>
		subcommand
			.setName("symbol")
			.setDescription("Display token info using token Symbol")
			.addStringOption((option) =>
				option
					.setName("symbol")
					.setDescription("Provide the token symbol")
					.setRequired(true),
			),
	)

	.addSubcommand((subcommand) =>
		subcommand
			.setName("address")
			.setDescription("Display token info using address")
			.addStringOption((option) =>
				option
					.setName("address")
					.setDescription("Provide the token address")
					.setRequired(true),
			),
	);

// Callback for discord
const execute = async (interaction) => {
	await token(interaction);
};

module.exports = { discordData, execute };

//Command function
async function token(interaction) {
	let tokenAddress;
	let tokenSymbol;
	let value;

	if (interaction.options.getSubcommand() === "symbol") {
		value = interaction.options.getString("symbol");
		const getTokenSymbol = await fetch(
			`https://indexer.alph.pro/api/tokens/symbol/${value}`,
		).then((a) => a.json());

		if (getTokenSymbol.tokens.length === 0) {
			await notSuccess(
				interaction,
				"No Token",
				`Token ${value.toUpperCase()} does not exist. `,
				true,
			);
			return;
		}
		tokenSymbol = value;
		tokenAddress = getTokenSymbol.tokens[0].address;
	} else if (interaction.options.getSubcommand() === "address") {
		value = interaction.options.getString("address");

		if (value.length < 10) {
			await notSuccess(
				interaction,
				"To Short",
				"Token address must contain at least 10 characters.",
				true,
			);
			return;
		}
		const getTokenSymbol =
			await fetch(`https://indexer.alph.pro/api/prices?address=${value}
              `).then((a) => a.json());
		if (getTokenSymbol.prices.length === 0) {
			await notSuccess(
				interaction,
				"Invalid Token",
				`${value} is not a valid token address. `,
				true,
			);
			return;
		}
		tokenSymbol = getTokenSymbol.prices[0].token.symbol;
		tokenAddress = value;
	}

	let tokenInfo =
		await fetch(`https://indexer.alph.pro/api/prices?address=${tokenAddress}
`).then((a) => a.json());

	tokenInfo = tokenInfo.prices[0];

	const tokenHolder = await fetch(
		`https://indexer.alph.pro/api/tokens/holders/${tokenAddress}`,
	).then((a) => a.json());

	const circulatingSupply =
		tokenHolder.holders[0].circulatingSupply / 10 ** tokenInfo.token.decimals;

	let socials;
	if (tokenInfo.token.social != null) {
		socials = Object.entries(tokenInfo.token.social)
			.slice(1)
			.filter(([key, value]) => value !== null)
			.map(([key, value]) => {
				const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
				return `[${formattedKey}](${value})`;
			})
			.join(" | ");
		socials += ` | [Explorer](https://explorer.alephium.org/addresses/${tokenInfo.token.address})`;
	} else {
		socials = `[Explorer](https://explorer.alephium.org/addresses/${tokenInfo.token.address})`;
	}

	const messageTokenInfo = `\`\`\`${"Name".padEnd(9)}: ${tokenInfo.token.name}
${"Symbol".padEnd(9)}: ${tokenInfo.token.symbol}
${"Decimals".padEnd(9)}: ${
		tokenInfo.token.decimals
	}\`\`\`\`\`\`${"Price".padEnd(9)}: $${
		tokenInfo.markets.length > 0
			? await commaFormat(await eighteenDigits(tokenInfo.price))
			: "Not Available"
	}
${"LP".padEnd(9)}: $${
		tokenInfo.markets.length > 0
			? await commaFormat(await eighteenDigits(tokenInfo.markets[0].liquidity))
			: "Not Available"
	} 
${"MC".padEnd(9)}: $${
		tokenInfo.markets.length > 0
			? await commaFormat(
					await eighteenDigits(circulatingSupply * tokenInfo.price),
			  )
			: "Not Available"
	}\`\`\`\`\`\`${"Supply".padEnd(9)}: ${await commaFormat(circulatingSupply)}
${"Holders".padEnd(9)}: ${await commaFormat(
		tokenHolder.holders[0].holderCount,
	)}\`\`\`\n${socials}`;
	await success(
		interaction,
		`${tokenInfo.token.symbol}`,
		messageTokenInfo,
		false,
		tokenInfo.token.logo,
	);
}
