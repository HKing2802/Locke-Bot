/* Command to stop command responses
 */

const fs = require('fs');
require('hjson/lib/require-config');
const config = require('../config.hjson');
const persistent = require('../persistent.json');
const { log } = require('../src/util.js');
const { Message } = require('discord.js');

const name = "toggebot";
const aliases = ["shutdown", "activate"]

/**
 * shuts down the active flag for the bot
 * @param {Message} message The message received by the bot
 * @param {Array<string>} args The arguments passed to the command and split by the processor
 * @returns {boolean}
 */
async function main(message, args) {
    if (message.author.id == config.authorID) {
        if (message.content.substring(1, 9) == 'shutdown') persistent.active = false;
        else if (message.content.substring(1, 9) == 'activate') persistent.active = true;
        else if (args[0] == "false") persistent.active = false;
        else if (args[0] == "true") persistent.active = true;
        else persistent.active = true;

        await fs.writeFile('./persistent.json', JSON.stringify(persistent, null, 2), (err) => {
            if (err) {
                log(`Could not write to persistent JSON: ${err}`, message.client, false, 'error');
                return false;
            }
        });

        log(`Switched active to ${persistent.active}`, message.client, false);
        await message.delete();
        return true;
    }
}

exports.main = main;
exports.name = name;
exports.data = {
    aliases: aliases
}