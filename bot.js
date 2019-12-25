var Discord = require('discord.js');
var logger = require('winston');
var auth = require('./auth.json');

var active = true;
var logChan;

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

function chanLog(message) {
    if (logChan == undefined) {
        logger.warn("no logging channel defined");
    } else {
        logChan.send(message);
    }
}

function getPerm(member) {
    var roles = member.roles;
    var ret = false;
    roles.forEach(role => {
        if (role.name == "admin" || role.name == "dadmin" || role.name == "moderator") {
            ret = true;
        }
    })
    return ret;
}

function process(recievedMessage) {
    logger.info(recievedMessage.content.substring(1));
    var cmdfull = recievedMessage.content.substring(1);
    var cmdparsed = cmdfull.split(" ");
    var cmd = cmdparsed[0];
    var args = cmdparsed.splice(1);

    var chan = recievedMessage.channel;
    switch (cmd) {
        case 'Ping':
        case 'ping':
            if (recievedMessage.author.username == "Icenoft") {
                chan.send("Imagine .ping");
            } else {
                chan.send("Pong!");
            }
            logger.info("Returned");
            logger.info();
            break;
        case 'ep':
        case 'endprocess':
        case 'endProcess':
            if (recievedMessage.author.id == "324302699460034561") {
                chan.send("Done");
                bot.destroy()
            } else {
                chan.send("You must be Admin to do that!");
            }
            break;
        case 'shutdown':
            if (recievedMessage.author.id == "324302699460034561") {
                chan.send("Stopping responses");
                logger.info("Stopping");
                logger.info();
                active = false;
            } else {
                chan.send("You must be Admin to do that!");
                logger.info("Rejected");
                logger.info();
            }
            break;
        case 'activate':
            if (recievedMessage.author.id == "324302699460034561") {
                chan.send("Restarting responses");
                logger.info("Restarting");
                logger.info();
                active = true;
            } else {
                chan.send("You must be Admin to do that!");
                logger.info("Rejected");
                logger.info();
            }
            break;
        case 'mute':
            var perm = getPerm(recievedMessage.member);
            if (perm) {
                if (recievedMessage.mention_everyone) {
                    chan.send("You can't mute everyone!");
                    logger.info("Rejected - Everyone tag");
                    logger.info();
                    break;
                } else if (recievedMessage.mentions.members.first() == undefined) {
                    chan.send("You need to mention someone!");
                    logger.info("Rejected - no mention");
                    logger.info()
                } else {
                    var memb = recievedMessage.mentions.members.first()
                    if (getPerm(memb)) {
                        chan.send("You can't mute a Moderator/Admin!");
                        logger.info("Rejected - Target Mod/Admin");
                        logger.info();
                    } else {
                        memb.addRole(recievedMessage.guild.roles.find(r => r.name === 'Muted'));
                        memb.removeRole(recievedMessage.guild.roles.find(r => r.name == 'Human'));
                        chan.send("User has been muted.");
                        chanLog("**" + memb.user.username + "#" + memb.user.discriminator + "** Has been muted by " + recievedMessage.author.username + ".");
                        logger.info(memb.user.username + " muted");
                        logger.info();
                    }
                }
            } else {
                chan.send("You don't have permission to mute someone!");
                logger.info("Rejected - Author Perm");
                logger.info();
            }
            break;
        case 'unmute':
            if (getPerm(recievedMessage.member)) {
                if (recievedMessage.mention_everyone) {
                    chan.send("You can't mute everyone!");
                    logger.info("Rejected - Everyone tag");
                    logger.info();
                } else if (recievedMessage.mentions.members.first() == undefined) {
                    chan.send("You need to mention someone!");
                    logger.info("Rejected - no mention");
                    logger.info()
                } else {
                    var memb = recievedMessage.mentions.members.first()
                    if (getPerm(memb)) {
                        chan.send("You can's mute a Moderator/Admin!");
                        logger.info("Rejected - Target Mod/Admin");
                        logger.info();
                    } else {
                        memb.addRole(recievedMessage.guild.roles.find(r => r.name === 'Human'));
                        memb.removeRole(recievedMessage.guild.roles.find(r => r.name == 'Muted'));
                        chan.send("User has been unmuted.");
                        chanLog("**" + memb.user.username + "#" + memb.user.discriminator + "** Has been unmuted by " + recievedMessage.author.username + ".");
                        logger.info(memb.user.username + " muted");
                        logger.info();
                    }
                }
            }
            break;
        case 'setLog':
            if (recievedMessage.author.id == "324302699460034561") {
                logChan = chan;
                chan.send("Setting Logging Channel")
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