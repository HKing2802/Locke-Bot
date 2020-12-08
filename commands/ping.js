
const name = "ping";

function main(message, args) {
    message.channel.send("Pong!");
}

exports.name = name;
exports.main = main;