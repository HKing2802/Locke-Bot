/* command to end the bot process
 * used for testing and debugging purposes
 */
const config = require('../config.json');
const db = require('../src/db.js');
const { log } = require('../src/util.js');

const name = "endprocess";
const aliases = ["ep"]

function main(message, args) {
    if (message.author.id == config.authorID) {
        log("Ending process...")
        message.client.destroy();
        db.disconnect();
    }
}

exports.name = name;
exports.main = main;