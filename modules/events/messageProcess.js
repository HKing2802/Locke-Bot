/* Module to handle message event
 */
const config = require('../../src/config.js');
const persistent = require('../../persistent.json');
const util = require('../../src/util.js');
const { process, getFunctions } = require('../../commands/processor.js');
const { Message, Client } = require('discord.js');

let commands;

/**
 * Filters and processes message;
 * @param {Message} message The message received by the client
 * @returns {Promise<boolean|undefined>}
 */
async function messageProcess(message) {
    if (await util.filterAttachment(message)) return;

    if (message.content.substring(0, 1) == config.getConfig('prefix')) {
        // checks if bot response is active and is in a guild and not a DM
        if ((persistent.active && message.guild != null) || message.author.id == config.getConfig('authorID')) {
            if (!commands) commands = getFunctions(config.getConfig('commands'));
            return process(message, commands)
                .then((status) => { return status })
                .catch(err => {
                    util.log(`Error on processing message: ${err}`, undefined, false, 'error');
                    return false;
                });
        } else
            return;
    }
}

/**
 * Starts the message event handler
 * @param {Client} client The client to start listening for messages
 */
function main(client) {
    // sets up event listener
    client.on('message', (message) => {
        messageProcess(message);
    });
}

exports.main = main;
exports.testing = {
    messageProcess: messageProcess
}