/* Internal event handler to shutdown the bot
 */
const moduleHandler = require('../src/module_handler.js');
const { log } = require('../src/util.js');
const config = require('../src/config.js');

async function shutdown(client) {
    console.log('starting shutdown')
    await log(`Shutting down ${client.user.tag}...`, client, false);

    // removes listeners
    client.removeAllListeners();

    // shuts down modules
    const modules = moduleHandler.getModules(config.getConfig('modules'), true);
    await moduleHandler.stopModules(modules, client);

    client.destroy();
    console.log('ending shutdown');
}

async function main(message, args) {
    if (message.author.id === config.getConfig('authorID')) {
        await shutdown(message.client);
    }
}

exports.main = main;
exports.name = "endprocess";
exports.data = {
    aliases: ['ep']
}
exports.testing = {
    shutdown: shutdown
}