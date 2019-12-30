var Discord = require('discord.js');
var logger = require('winston');
var auth = require('./auth.json');

var active = true;
var logChan;
var delMsgs = [];

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

//var token = process.env.auth_token;
var token = auth.token;
//logger.info(token);

var bot = new Discord.Client();
bot.login(token);

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

function getPerm(member, boolHelp) {
    var roles = member.roles;
    var ret = false;
    roles.forEach(role => {
        if (role.name == "admin" || role.name == "dadmin" || role.name == "moderator") {
            ret = true;
        } else if (boolHelp && role.name == "Helper") {
            ret = true;
        }
    })
    return ret;
}

function help(chan) {
    const embed = new Discord.RichEmbed()
        .setTitle("Help Menu")
        .addField("ping", "Pong!")
        .addField("mute", "Mutes a user, must be Mod/Admin")
        .addField("unmute", "Unmutes a user, must be a Mod/Admin")
        .addField("snipe", "gets the user's deleted messages, must be a Mod/Admin")
        .addField(".Help", "Displays this Message");

    chan.send(embed);
}

function process(recievedMessage) {
    logger.info(recievedMessage.content.substring(1));
    var cmdfull = recievedMessage.content.substring(1).toLowerCase();
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
            logger.info("Returned");
            break;
        case 'ep':
        case 'endprocess':
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
                active = false;
            } else {
                chan.send("You must be Admin to do that!");
                logger.info("Rejected");
            }
            break;
        case 'activate':
            if (recievedMessage.author.id == "324302699460034561") {
                chan.send("Restarting responses");
                logger.info("Restarting");
                active = true;
            } else {
                chan.send("You must be Admin to do that!");
                logger.info("Rejected");
            }
            break;
        case 'mute':
            var perm = getPerm(recievedMessage.member, true);
            if (perm) {
                if (recievedMessage.mention_everyone) {
                    chan.send("You can't mute everyone!");
                    logger.info("Rejected - Everyone tag");
                    break;
                } else if (recievedMessage.mentions.members.first() == undefined) {
                    chan.send("You need to mention someone!");
                    logger.info("Rejected - no mention");
                } else if (recievedMessage.mentions.members.first().user.id == "658702825689448466") {
                    chan.send("I can't mute myself!");
                    logger.info("Rejected - Self Mention");
                } else {
                    var memb = recievedMessage.mentions.members.first()
                    if (getPerm(memb, false)) {
                        chan.send("You can't mute a Moderator/Admin!");
                        logger.info("Rejected - Target Mod/Admin");
                    } else {
                        memb.addRole(recievedMessage.guild.roles.find(r => r.name === 'Muted'));
                        memb.removeRole(recievedMessage.guild.roles.find(r => r.name == 'Human'));
                        chan.send("User has been muted.");
                        chanLog("**" + memb.user.username + "#" + memb.user.discriminator + "** Has been muted by " + recievedMessage.author.username + ".");
                        logger.info(memb.user.username + " muted");
                    }
                }
            } else {
                chan.send("You don't have permission to mute someone!");
                logger.info("Rejected - Author Perm");
            }
            break;
        case 'unmute':
            if (getPerm(recievedMessage.member, true)) {
                if (recievedMessage.mention_everyone) {
                    chan.send("You can't unmute everyone!");
                    logger.info("Rejected - Everyone tag");
                } else if (recievedMessage.mentions.members.first() == undefined) {
                    chan.send("You need to mention someone!");
                    logger.info("Rejected - no mention");
                } else if (recievedMessage.mentions.members.first().user.id == "658702825689448466") {
                    chan.send("I can't unmute myself!");
                    logger.info("Rejected - Self Mention");
                } else {
                    var memb = recievedMessage.mentions.members.first()
                    if (getPerm(memb, false)) {
                        chan.send("You can't unmute a Moderator/Admin!");
                        logger.info("Rejected - Target Mod/Admin");
                    } else {
                        memb.addRole(recievedMessage.guild.roles.find(r => r.name === 'Human'));
                        memb.removeRole(recievedMessage.guild.roles.find(r => r.name == 'Muted'));
                        chan.send("User has been unmuted.");
                        chanLog("**" + memb.user.username + "#" + memb.user.discriminator + "** Has been unmuted by " + recievedMessage.author.username + ".");
                        logger.info(memb.user.username + " unmuted");
                    }
                }
            } else {
                chan.send("You don't have permission to unmute someone!");
                logger.info("Rejected - Author Perm");
            }
            break;
        case 'setlog':
            if (recievedMessage.author.id == "324302699460034561") {
                logChan = chan;
                logger.info("Set Logging Channel");
                chan.send("Setting Logging Channel");
            }
            break;
        case 'help':
            help(chan);
            logger.info("Responded");
            break;
        case 'snipe':
            if (getPerm(recievedMessage.member, true)) {
                if (recievedMessage.mention_everyone) {
                    chan.send("You can't snipe everyone!");
                    logger.info("Rejected - Everyone tag");
                } else if (recievedMessage.mentions.members.first() == undefined) {
                    chan.send("You need to mention someone!");
                    logger.info("Rejected - no mention");
                } else if (recievedMessage.mentions.members.first().user.id == "658702825689448466") {
                    chan.send("I can't snipe myself!");
                    logger.info("Rejected - Self Mention");
                } else {
                    var memb = recievedMessage.mentions.members.first()
                    logger.info("Sniping " + memb.user.username);
                    for (var i = 0; i < delMsgs.length; i++) {
                        if (delMsgs[i].author.id == memb.user.id) {
                            chan.send(delMsgs[i].createdAt + ": `" + delMsgs[i].content + "`");
                        }
                    }
                }
            } else {
                chan.send("You don't have permission to snipe someone!");
                logger.info("Rejected - Author Perm");
            }
            break;
        case 'dmpdel':
            if (recievedMessage.author.id == "324302699460034561") {
                for (var i = 0; i < delMsgs.length; i++) {
                    chan.send("`" + delMsgs[i].author.username + "` @ " + delMsgs[i].createdAt + ": `" + delMsgs[i].content + "`");
                }
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

bot.on('messageDelete', (delmsg) => {
    delMsgs.unshift(delmsg);
    logger.info("Deleted Message Logged");
    if (delMsgs.length > 50) {
        delMsgs.pop();
    }
})