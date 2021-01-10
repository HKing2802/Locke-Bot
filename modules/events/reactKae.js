require('hjson/lib/require-config');
const config = require('../../config.hjson');

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