// Module used for testing only
const Discord = require('discord.js');

function main(channel) {
    if (channel instanceof Discord.Channel) {
        channel.send("Test Module")
            .then((msg) => { return msg });
    } else {
        return channel;
    }
}

exports.main = main;