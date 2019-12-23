var Discord = require('discord.js');
var logger = require('winston');
var auth = require('./auth.json');
const { DiscordBot } = require("dynobot-framework");

var active = true;

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

var bot = new DiscordBot(auth.token);

bot.onEvent('ready', () => {
    logger.info(`Logged in!`);
});

function process(recievedMessage) {
    logger.info(recievedMessage.getContent().substring(1));
    var cmdfull = recievedMessage.getContent().substring(1);
    var cmdparsed = cmdfull.split(" ");
    var cmd = cmdparsed[0];
    var args = cmdparsed.splice(1);

    var chan = recievedMessage.getChannel();
    var author = recievedMessage.getAuthor();

    switch (cmd) {
        case 'ping':
            if (author.getName() == "Icenoft") {
                chan.send("Imagine .ping");
            } else {
                chan.send("Pong!");
            }
            break;
        /*case 'ep':
        case 'endProcess':
        case 'endprocess':
            if (author.getId() == "324302699460034561") {
                chan.send("Killing Myself...");
                error("Ending Process");
            } else {
                chan.send("You must be Admin to do that!");
            }
            break;*/
        case 'shutdown':
            if (author.getId() == "324302699460034561") {
                chan.send("Stopping responses");
                active = false;
            } else {
                chan.send("You must be Admin to do that!");
            }
            break;
        case 'activate':
            if (author.getId() == "324302699460034561") {
                chan.send("Restarting responses");
                active = true;
            } else {
                chan.send("You must be Admin to do that!");
            }
            break;
        case 'getPerm':
            var roles = recievedMessage.getAuthorRoles();
            roles.forEach(role => {
                if (role.getName() == "admin" || role.getName() == "dadmin" || role.getName() == "moderator") {
                    chan.send("Approved");
                    return;
                }
            })
            chan.send("Done");
            break;
    }
            
}

bot.onEvent('message', (recievedMessage) => {
    if (recievedMessage.getAuthor() == bot.getClient()) {
        return
        //prevent responding to its own message
    }
    if (recievedMessage.getContent().substring(0, 1) == ".") {
        if (active) {
            process(recievedMessage);
        } else {
            if (recievedMessage.getAuthor().getId() == "324302699460034561") {
                process(recievedMessage);
            } else {
                return
            }
        }

    }
})