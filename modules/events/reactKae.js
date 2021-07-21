const config = require('../../src/config.js');

function react(message) {
    if (message.author.id === config.get('kaeID') && config.liveData.get('kaeReact')) {
        // reacts with emoji
        message.react(message.guild.emojis.cache.get(config.get('modsgayEmojiID')));
    }
}

function main(client) {
    client.on('message', (message) => {
        react(message);
    })
}

exports.main = main;
exports.react = react;