// JavaScript source code
var bot = require('./bot.js');

var methods = {};

methods.reactKae = function() {
    if (bot.getPerm(bot.receivedMessage.member, false) || bot.receivedMessage.author.id == "324302699460034561") {
        if (bot.kaeMessageReact) {
            bot.kaeMessageReact = false;
            bot.logger.info("Disabled Auto-react");
        } else {
            bot.kaeMessageReact = true;
            bot.logger.info("Enabled Auto-react");
        }
    }
}

methods.ping = function() {
    if (receivedMessage.author.username == "Icenoft") {
        bot.chan.send("Imagine .ping");
    } else {
        bot.chan.send("Pong!");
    }
}

module.exports = methods;