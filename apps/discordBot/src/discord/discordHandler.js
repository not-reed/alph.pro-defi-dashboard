const fs = require("fs");
const { Collection } = require("discord.js");
const { discordClient } = require("../index.js");

const commandFiles = fs
  .readdirSync(`${__dirname}/../commands`)
  .filter((file) => file.endsWith(".js"));

const commands = [];

discordClient.commands = new Collection();
for (const file of commandFiles) {
  const command = require(`${__dirname}/../commands/${file}`);
  commands.push(command.discordData.toJSON());
  discordClient.commands.set(command.discordData.name, command);
}

const eventFiles = fs
  .readdirSync(`${__dirname}/events`)
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const event = require(`${__dirname}/events/${file}`);
  if (event.once) {
    discordClient.once(event.name, (...args) =>
      event.execute(...args, commands)
    );
  } else {
    discordClient.on(event.name, (...args) => event.execute(...args, commands));
  }
}

discordClient.login(process.env.DISCORD_BOT_TOKEN);
