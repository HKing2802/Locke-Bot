/* Internal event handler to shutdown the bot
 */
const moduleHandler = require('../src/module_handler.js');
const { log } = require('../src/util.js');
require('hjson/lib/require-config');
const config = require('../config.hjson');

async function shutdown(client) {
    console.log('starting shutdown')
    await log(`Shutting down ${client.user.tag}...`, client, false);

    // removes listeners
    client.removeAllListeners();

    // shuts down modules
    const modules = moduleHandler.getModules(config.modules, true);
    await moduleHandler.stopModules(modules, client);

    client.destroy();
    console.log('ending shutdown');
}

async function main(message, args) {
    await shutdown(message.client);
}

exports.main = main;
exports.name = "endprocess";
exports.data = {
    aliases: ['ep']
}
exports.testing = {
    shutdown: shutdown
}