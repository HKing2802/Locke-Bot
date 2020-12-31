/* Simple module to toggle the reactKae module
 */
const fs = require('fs');
const config = require('../config.json');
const { log } = require('../src/util.js');
const { Message } = require('discord.js');

const name = "reactkae";
const aliases = ['rk'];

/**
 * Switches the reactKae toggle
 * command is limited to the author and Kae, the reciever of the reactions
 * @param {Message} message
 * @param {Array<string>} args
 * @returns {undefined}
 */
async function main(message, args) {
    if (message.author.id == config.authorID || message.author.id == config.kaeID) {
        const current = Boolean(config.kaeReact);
        let change = !current;

        if (args[0] == "false") change = false;
        if (args[0] == "true") change = true;

        config.kaeReact = change;
        fs.writeFile('./config.json', JSON.stringify(config, null, 2), (err) => {
            if (err) log(`Could not write to config JSON: ${err}`, message.client, true, 'error');
            log(`Switched reactKae to ${change}`, message.client);
            message.delete();
        });
    }
}

exports.main = main;
exports.name = name;
exports.data = {
    aliases: aliases
}