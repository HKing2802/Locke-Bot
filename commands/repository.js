/* Simple command to display the repository of the bot
 */
const package = require('../package.json');
const { MessageEmbed, Message } = require("discord.js");

const name = "repository";
const desc = "Displays LockeBot's github repository";
const aliases = ['repo'];

/**
 * Sends an embed with LockeBot's repository link
 * @param {Message} message The message received by the bot
 * @param {Array<string>} args The arguments provided to the command and split by processor
 * @returns {Promise<undefined>}
 */
async function main(message, args) {
    const embed = new MessageEmbed()
        .setTitle("Repository")
        .setThumbnail(message.client.user.avatarURL())
        .setDescription(package.repository.url)
        .setFooter("v" + package.version + " — Developed by HKing#9193");
    message.channel.send(embed);
}

exports.main = main;
exports.name = name;
exports.data = {
    description: desc,
    aliases: aliases
}