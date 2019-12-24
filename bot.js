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
bot.login(process.env.BOT_TOKEN);

bot.on('ready', () => {
    logger.info(`Logged in as ${bot.user.tag}!`);
});

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
        case 'mute':
            var perm = getPerm(recievedMessage.member);
            if (perm) {
                if (recievedMessage.mention_everyone) {
                    chan.send("You can't mute everyone!");
                    break;
                } else if (recievedMessage.mentions.members.first() == undefined) {
                    chan.send("You need to mention someone!");
                } else {
                    var memb = recievedMessage.mentions.members.first()
                    if (getPerm(memb)) {
                        chan.send("You can't mute a Moderator/Admin!");
                    } else {
                        memb.addRole(recievedMessage.guild.roles.find(r => r.name === 'Muted'));
                        memb.removeRole(recievedMessage.guild.roles.find(r => r.name == 'Human'));
                        chan.send("User has been muted.");
                    }
                }
            } else {
                chan.send("You don't have permission to mute someone!");
            }
            break;
        case 'unmute':
            if (getPerm(recievedMessage.member)) {
                if (recievedMessage.mention_everyone) {
                    chan.send("You can't mute everyone!");
                } else if (recievedMessage.mentions.members.first() == undefined) {
                    chan.send("You need to mention someone!");
                } else {
                    var memb = recievedMessage.mentions.members.first()
                    if (getPerm(memb)) {
                        chan.send("You can's mute a Moderator/Admin!");
                    } else {
                        memb.addRole(recievedMessage.guild.roles.find(r => r.name === 'Human'));
                        memb.removeRole(recievedMessage.guild.roles.find(r => r.name == 'Muted'));
                        chan.send("User has been unmuted.");
                    }
                }
            }
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