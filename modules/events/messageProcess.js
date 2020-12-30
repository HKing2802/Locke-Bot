/* Module to handle message event
 */
const config = require('../../config.json');
const util = require('../../src/util.js');
const { process } = require('../../commands/processor.js');

async function messageProcess(message) {
    if (util.filterAttachment(message))
        return;

    if (message.content.substring(0, 1) == config.prefix) {
        // checks if bot response is active and is in a guild and not a DM
        if (config.active == 'true' && message.guild != null) {  
            process(message);

        // checks if message author is author and then processes even if active is false
        } else if (message.author.id == config.authorID) {  
            process(message);
        } else
            return;

    // checks if message author is Kae and reaction is active

    }
}

function main(client) {
    client.on('message', (message) => {
        messageProcess(message);
    });
}

exports.main = main;
exports.messageProcess = messageProcess;