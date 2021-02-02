/* Simple module to toggle the reactKae module
 */
const fs = require('fs');
require('hjson/lib/require-config');
const config = require('../config.hjson');
const persistent = require('../persistent.json');
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
    if (message.author.id == config.authorID || message.author.id == config.kaeID) {
        let current;
        if (persistent.kaeReact == "true") current = true;
        else if (persistent.kaeReact == "false") current = false;
        let change = !current;

        if (args[0] == "false") change = false;
        if (args[0] == "true") change = true;

        persistent.kaeReact = change;
        await fs.writeFile('./persistent.json', JSON.stringify(persistent, null, 2), (err) => {
            if (err) log(`Could not write to persistent JSON: ${err}`, message.client, false, 'error');
            log(`Switched reactKae to ${change}`, message.client, false);
        });
        await message.delete();
    }
}

exports.main = main;
exports.name = name;
exports.data = {
    aliases: aliases
}