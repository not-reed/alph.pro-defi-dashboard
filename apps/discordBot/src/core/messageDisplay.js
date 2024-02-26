const { EmbedBuilder } = require("discord.js");

//Send message to user in channel when command is not success
async function notSuccess(interaction, title, desc) {
  const messageEmbed = new EmbedBuilder()
    .setColor(0xff0000)
    .setTitle(title)
    .setDescription(desc);
  interaction.reply({
    embeds: [messageEmbed],
    ephemeral: true,
  });
}

//Send message to user in channel when command is successful
async function success(interaction, title, desc) {
  const messageEmbed = new EmbedBuilder()
    .setColor(0x00ff000)
    .setTitle(title)
    .setDescription(desc);
  interaction.reply({
    embeds: [messageEmbed],
    ephemeral: true,
  });
}

async function successFollowUp(interaction, title, desc) {
  const messageEmbed = new EmbedBuilder()
    .setColor(0x00ff000)
    .setTitle(title)
    .setDescription(desc);
  interaction.followUp({
    embeds: [messageEmbed],
    ephemeral: true,
  });
}

async function notSuccessFollowUp(interaction, title, desc) {
  const messageEmbed = new EmbedBuilder()
    .setColor(0xff0000)
    .setTitle(title)
    .setDescription(desc);
  interaction.followUp({
    embeds: [messageEmbed],
    ephemeral: true,
  });
}

//Send attachment to user in channel when command is successful
async function sendAttachment(interaction, title, desc, attachment) {
  const messageEmbed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle(title)
    .setDescription(desc);
  interaction.reply({
    embeds: [messageEmbed],
    files: [attachment],
    ephemeral: true,
  });
}

module.exports = {
  success: success,
  notSuccess: notSuccess,
  sendAttachment: sendAttachment,
  successFollowUp: successFollowUp,
  notSuccessFollowUp: notSuccessFollowUp,
};
