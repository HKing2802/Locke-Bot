// Module used for testing only
const Discord = require('discord.js');

function start(channel) {
    if (channel instanceof Discord.Channel) {
        channel.send("Test Module")
            .then((msg) => { return msg });
    } else {
        return channel;
    }
}
function stop(channel) {
    if (channel instanceof Discord.Channel) {
        channel.send("Test Module")
            .then((msg) => { return msg });
    } else {
        return channel;
    }
}

exports.start = start;
exports.stop = stop;