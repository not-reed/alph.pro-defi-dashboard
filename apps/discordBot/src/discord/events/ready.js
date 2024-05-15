const { REST, Routes, ActivityType } = require("discord.js");

module.exports = {
	name: "ready",
	once: true,
	execute(discordClient, commands) {
		discordClient.user.setActivity("with Alephium", {
			type: ActivityType.Playing,
		});
		console.log(`Discord Logged in as ${discordClient.user.tag}!`);
		const rest = new REST({ version: "10" }).setToken(
			process.env.DISCORD_BOT_TOKEN,
		);
		(async () => {
			try {
				//
				//// Run globally
				await rest
					.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), {
						body: commands,
					})
					.then(() => console.log("Successfully reloaded all Global commands."))
					.catch(console.error);
				//
				//
				// Run locally (only on guild)
				// await rest
				// 	.put(
				// 		Routes.applicationGuildCommands(
				// 			process.env.DISCORD_CLIENT_ID,
				// 			process.env.GUILD_ID,
				// 		),
				// 		{ body: commands },
				// 	)
				// 	.then(() => console.log("Successfully reloaded all guild commands."))
				// 	.catch(console.error);
				//
				//  //***** Don't uncomment if you don't know what you are doing *****
				// //****** Delete slash commands ******
				// // for guild-based commands
				// rest.put(Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.GUILD_ID), { body: [] })
				//     .then(() => console.log('Successfully deleted all guild commands.'))
				//     .catch(console.error);
				// // for global commands
				// rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: [] })
				//     .then(() => console.log('Successfully deleted all application commands.'))
				//     .catch(console.error);
				// //****** Delete slash commands ******
			} catch (error) {
				console.error(error);
			}
		})();
	},
};
