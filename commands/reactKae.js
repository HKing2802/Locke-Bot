/* Simple module to toggle the reactKae module
 */
const config = require('../src/config.js');
const { log } = require('../src/util.js');
const { Message } = require('discord.js');

const name = "reactkae";
const aliases = ['rk'];

/**
 * Switches the reactKae toggle
 * command is limited to the author and Kae, the reciever of the reactions
 * @param {Message} message The message received by the bot
 * @param {Array<string>} args The arguments passed to the command and split by the processor
 * @returns {undefined}
 */
async function main(message, args) {
    if (message.author.id == config.get('authorID') || message.author.id == config.get('kaeID')) {
        let change;
        if (args[0].toLowerCase() === "false") { change = false; }
        else if (args[0].toLowerCase() === "true") { change = true; }
        else {
            change = !(config.liveData.get('kaeReact'));
        }

        config.liveData.set('kaeReact', change);
        log(`Switched reactKae to ${change}`, message.client, false);

        await message.delete();
    }
}

exports.main = main;
exports.name = name;
exports.data = {
    aliases: aliases
}