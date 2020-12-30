const config = require('../../config.json');

function react(message) {
    if (message.author.id == config.kaeID && config.kaeReact == 'true') {
        // reacts with emoji
        message.react(message.guild.emojis.cache.get(config.modsgayEmojiID));
    }
}

function main(client) {
    client.on('message', (message) => {
        react(message);
    })
}

exports.main = main;
exports.react = react;