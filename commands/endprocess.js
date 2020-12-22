/* command to end the bot process
 * used for testing and debugging purposes
 */
const config = require('../config.json');

const name = "endprocess";
const aliases = ["ep"]

function main(message, args) {
    if (message.author.id == config.authorID) {
        message.client.destroy();
    }
    // TODO: verify
    // TODO: destroy bot
    // TODO: flush any changes to db or files
    // TODO: close db connection
}

exports.name = name;
exports.main = main;