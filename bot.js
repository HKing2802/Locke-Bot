var Discord = require('discord.js');
var logger = require('winston');
var auth = require('./auth.json');

var active = true;

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

var bot = new Discord.Client();
bot.login(auth.token);

bot.on('ready', () => {
    logger.info(`Logged in as ${bot.user.tag}!`);
});

function process(recievedMessage) {
    logger.info(recievedMessage.content.substring(1));
    var cmdfull = recievedMessage.content.substring(1);
    var cmdparsed = cmdfull.split(" ");
    var cmd = cmdparsed[0];
    var args = cmdparsed.splice(1);

    var chan = recievedMessage.channel;
    switch (cmd) {
        case 'ping':
            if (recievedMessage.author.username == "Icenoft") {
                chan.send("Imagine .ping");
            } else {
                chan.send("Pong!");
            }
            break;
        case 'endProcess':
            if (recievedMessage.author.id == "324302699460034561") {
                chan.send("Killing Myself...");
                bot.destroy()
            } else {
                chan.send("You must be Admin to do that!");
            }
            break;
        case 'repeat':
            var rep = ""
            for (var i = 0; i < args.length; i++) {
                rep = rep + args[i] + " ";
            }
            chan.send("Here it is again:\n" + rep);
            break;
        case 'shutdown':
            if (recievedMessage.author.id == "324302699460034561") {
                chan.send("Stopping responses");
                active = false;
            } else {
                chan.send("You must be Admin to do that!");
            }
            break;
        case 'activate':
            if (recievedMessage.author.id == "324302699460034561") {
                chan.send("Restarting responses");
                active = true;
            } else {
                chan.send("You must be Admin to do that!");
            }
            break;
    }
}

bot.on('message', (recievedMessage) => {
    if (recievedMessage.author == bot.user) {
        return
        //prevent responding to its own message
    }
    if (recievedMessage.content.substring(0, 1) == ".") {
        if (active) {
            process(recievedMessage);
        } else {
            if (recievedMessage.author.id == "324302699460034561") {
                process(recievedMessage);
            } else {
                return
            }
        }

    }
})