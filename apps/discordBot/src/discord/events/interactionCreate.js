const messageDisplay = require("../../core/messageDisplay.js");

module.exports = {
  name: "interactionCreate",
  once: false,
  async execute(interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(
          interaction.commandName
        );
        if (!command) return;
        try {
          await command.execute(interaction);
        } catch (err) {
          console.error(err);
          await messageDisplay.notSuccess(
            interaction,
            "Error",
            "An error occurred while executing the command",
            true
          );
        }
      } else if (interaction.isStringSelectMenu()) {
        const command = interaction.client.commands.get(interaction.customId);
        if (!command) return;
        try {
          await command.menuInteraction(interaction);
        } catch (err) {
          console.error(err);
          await messageDisplay.notSuccess(
            interaction,
            "Error",
            "An error occurred while executing the menu interaction",
            true
          );
        }
      }
    } catch (err) {
      console.log("Inside event/interactionCreate ", err);
    }
  },
};
