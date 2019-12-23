var Discord = require('discord.js');
var logger = require('winston');
var auth = require('./auth.json');

var bk = false;

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

bot.on('message', (recievedMessage) => {
    if (recievedMessage.author == bot.user) {
        return
        //prevent responding to its own message
    }
    if (recievedMessage.content.substring(0, 1) == ".") {
        logger.info(recievedMessage.content.substring(1));
        var cmdfull = recievedMessage.content.substring(1);
        var cmdparsed = cmdfull.split(" ");
        var cmd = cmdparsed[0];
        var args = cmdparsed.splice(1);

        var chan = recievedMessage.channel;

        switch (cmd) {
            case 'ping':
                chan.send("Pong!");
                break;
            case 'endProcess':
                chan.send("Killing Myself...");
                bot.destroy()
                break;
            case 'repeat':
                var rep = ""
                for (var i = 0; i < args.length; i++) {
                    rep = rep + args[i];
                }
                chan.send("Here it is again:\n" + rep);
                break;
        }
    }
})