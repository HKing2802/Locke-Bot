var Discord = require('discord.js');
var logger = require('winston');
var auth = require('./auth.json');
var package = require('./package.json');
//var aws = require('aws-sdk');
//var cloudMersiveApi = require('cloudmersive-virus-api-client');

var active = true;
var kaeMessageReact = false;
var logChan;
var delMsgs = [];

//muted users stored in case they have member role
var muted = [];

//event List used for timed events
//setup: [str eventType, int time, [any extra_data]]
var eventList = new Array(0);

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

var token = auth.token;

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
    if (member.roles.cache.has("560853657608781841") || member.roles.cache.has("625898632830517249") || member.roles.cache.has("560853468953313299")) {
        return true;
    } else if (member.roles.cache.has("560853327894806568") && boolHelp) {
        return true;
    } else {
        return false;
    }
}

function help(chan) {
    const embed = new Discord.MessageEmbed()
        .setAuthor("LockeBot")
        .setTitle("Help Menu")
        .setDescription("Some Helpful Commands")
        .addFields(
            { name: 'Ping', value: 'Pong!' },
            { name: 'mute', value: 'Mutes a user, must ba a Mod/Admin' },
            { name: 'unmute', value: 'Unmutes a user, must be a Mod/Admin' },
            { name: 'snipe', value: 'Gets the user\'s deleted messages, must be a Mod/Admin' },
            { name: 'verify', value: 'verifies a user, must be a staff member'},
            { name: 'kick', value: 'Kicks a user from the server, must be a Mod/Admin' },
            { name: 'ban', value: 'Bans a user from the server, must be a Mod/Admin'},
            { name: 'Help', value: 'Displays this Message' })
        .setFooter("v" + package.version + " -- Developed by HKing#9193");

    chan.send(embed);
}

function namecheck(name) {
    if (name == null) {
        return false;
    }
    for (var i = 0; i < name.length; i++)
        if (name.charCodeAt(i) > 127)
            return true;
    return false;
}

//---------------------------Event Iterator-----------------------------------\\

function eviter() {
    if (eventList.length == 0) {
        return;
    }
    for (var i = 0; i < eventList.length; i++) {
        if (eventList[i][1] == null) {
            eventList.length = eventList.length - 1;
            return;
        }
        eventList[i][1] = eventList[i][1] - 1;
        if (eventList[i][1] == 0) {
            switch (eventList[i][0]) {
                case "mute":
                    eventList[i][2].roles.add(bot.guilds.cache.get("560847285874065408").roles.cache.get("608319663780265989"));
                    eventList[i][2].roles.remove(bot.guilds.cache.get("560847285874065408").roles.cache.get("562452717445054474"));
                    logger.info("time unmuted " + eventList[i][2].user.username);
                    if (muted.length != 0) {
                        for (var j = 0; j < muted.length; j++) {
                            if (muted[j] == eventList[i][2].id) {
                                muted[j] = null;
                                eventList[i][2].roles.add(bot.guilds.cache.get("560847285874065408").roles.cache.get("561708861182967828"))
                                logger.info("Reinstated member role");
                            }
                        }
                    }
                    break;
            }
            var sarray = eventList.splice(0, i);
            var farray = eventList.splice(i + 1);
            if (i == 0) {
                eventList = farray;
            } else {
                sarray.push(farray);
                eventList = sarray;
            }
        }
    }
}

setInterval(eviter, 1000);

//--------------------Muted Members Garbage Collection------------------------\\

function clearMuted() {
    if (muted.length == 0) {
        return;
    }
    for (var i = 0; i < muted.length; i++) {
        if (muted[i] == null) {
            var smarray = muted.splice(0, i);
            var fmarray = muted.splice(i + 1);
            if (i == 0) {
                muted = fmarray;
            } else {
                smarray.push(fmarray);
                muted = smarray;
            }
        }
    }
}

setInterval(clearMuted, 600000);
//-----------------------------------------------------------------------------\\

function process(receivedMessage) {
    logger.info(receivedMessage.content.substring(1));
    var cmdfull = receivedMessage.content.substring(1).toLowerCase();
    var cmdparsed = cmdfull.split(" ");
    var cmd = cmdparsed[0];
    var args = cmdparsed.splice(1);

    var chan = receivedMessage.channel;
    switch (cmd) {
        case 'ping':
            if (receivedMessage.author.username == "Icenoft") {
                chan.send("Imagine .ping");
            } else {
                chan.send("Pong!");
            }
            break;
        case 'ep':
        case 'endprocess':
            if (receivedMessage.author.id == "324302699460034561") {
                chan.send("Done");
                bot.destroy();
            } else {
                chan.send("You must be Admin to do that!");
            }
            break;
        case 'shutdown':
            if (receivedMessage.author.id == "324302699460034561") {
                chan.send("Stopping responses");
                logger.info("Stopping");
                active = false;
            } else {
                chan.send("You must be Admin to do that!");
                logger.info("Rejected");
            }
            break;
        case 'activate':
            if (receivedMessage.author.id == "324302699460034561") {
                chan.send("Restarting responses");
                logger.info("Restarting");
                active = true;
            } else {
                chan.send("You must be Admin to do that!");
                logger.info("Rejected");
            }
            break;
        case 'mute':
            var perm = getPerm(receivedMessage.member, true);
            if (perm) {
                if (receivedMessage.mention_everyone) {
                    chan.send("You can't mute everyone!");
                    logger.info("Rejected - Everyone tag");
                    break;
                } else if (receivedMessage.mentions.members.first() == undefined) {
                    chan.send("You need to mention someone!");
                    logger.info("Rejected - no mention");
                } else if (receivedMessage.mentions.members.first().user.id == "658702825689448466") {
                    chan.send("I can't mute myself!");
                    logger.info("Rejected - Self Mention");
                } else {
                    var memb = receivedMessage.mentions.members.first()
                    if (getPerm(memb, false)) {
                        chan.send("You can't mute a Moderator/Admin!");
                        logger.info("Rejected - Target Mod/Admin");
                    } else {
                        memb.roles.add(receivedMessage.guild.roles.cache.get("562452717445054474"));
                        memb.roles.remove(receivedMessage.guild.roles.cache.get("608319663780265989"));

                        if (memb.roles.cache.has("561708861182967828")) {
                            memb.roles.remove(receivedMessage.guild.roles.cache.get("561708861182967828"));
                            muted.unshift(memb.id);
                        }

                        if (args[1] != null) {
                            var time = parseInt(args[1]);
                            if (time == "NaN") {
                                chan.send("Time is not a number!");
                            } else if (time < 0) {
                                chan.send("Invalid time, try again");
                            } else if (time == 0) {
                                chan.send("Cannot mute for 0 minutes!");
                            } else {
                                eventList.push(["mute", time * 60, receivedMessage.mentions.members.first()]);
                                if (time == 1) {
                                    chan.send("Muted " + receivedMessage.mentions.users.first().username + " for " + time + " minute");
                                } else {
                                    chan.send("Muted " + receivedMessage.mentions.users.first().username + " for " + time + " minutes");
                                }
                            }

                        } else {
                            chan.send("User has been muted.");
                            chanLog("**" + memb.user.username + "#" + memb.user.discriminator + "** Has been muted by " + receivedMessage.author.username + ".");
                            logger.info(memb.user.username + " muted");
                        }
                    }
                }
            } else {
                chan.send("You don't have permission to mute someone!");
                logger.info("Rejected - Author Perm");
            }
            break;
        case 'unmute':
            if (getPerm(receivedMessage.member, true)) {
                if (receivedMessage.mention_everyone) {
                    chan.send("You can't unmute everyone!");
                    logger.info("Rejected - Everyone tag");
                } else if (receivedMessage.mentions.members.first() == undefined) {
                    chan.send("You need to mention someone!");
                    logger.info("Rejected - no mention");
                } else if (receivedMessage.mentions.members.first().user.id == "658702825689448466") {
                    chan.send("I can't unmute myself!");
                    logger.info("Rejected - Self Mention");
                } else {
                    var memb = receivedMessage.mentions.members.first()
                    if (getPerm(memb, false)) {
                        chan.send("You can't unmute a Moderator/Admin!");
                        logger.info("Rejected - Target Mod/Admin");
                    } else {
                        memb.roles.add(receivedMessage.guild.roles.cache.get("608319663780265989"));
                        memb.roles.remove(receivedMessage.guild.roles.cache.get("562452717445054474"));

                        if (muted.length != 0) {
                            for (var i = 0; i < muted.length; i++) {
                                if (muted[i] == memb.id) {
                                    memb.roles.add(receivedMessage.guild.roles.cache.get("561708861182967828"));
                                    logger.info("Reinstated member role");
                                }
                            }
                        }

                        chan.send("User has been unmuted.");
                        chanLog("**" + memb.user.username + "#" + memb.user.discriminator + "** Has been unmuted by " + receivedMessage.author.username + ".");
                        logger.info(memb.user.username + " unmuted");
                    }
                }
            } else {
                chan.send("You don't have permission to unmute someone!");
                logger.info("Rejected - Author Perm");
            }
            break;
        case 'setlog':
            if (receivedMessage.author.id == "324302699460034561") {
                logChan = chan;
                logger.info("Set Logging Channel");
                chan.send("Setting Logging Channel");
            } else {
                chan.send("You must be Admin to do that!");
                logger.info("Rejected");
            }
            break;
        case 'help':
            help(chan);
            logger.info("Responded");
            break;
        case 'snipe':
            if (getPerm(receivedMessage.member, true)) {
                if (receivedMessage.mention_everyone) {
                    chan.send("You can't snipe everyone!");
                    logger.info("Rejected - Everyone tag");
                } else if (receivedMessage.mentions.members.first() == undefined) {
                    chan.send("You need to mention someone!");
                    logger.info("Rejected - no mention");
                } else if (receivedMessage.mentions.members.first().user.id == "658702825689448466") {
                    chan.send("I can't snipe myself!");
                    logger.info("Rejected - Self Mention");
                } else {
                    var memb = receivedMessage.mentions.members.first()
                    logger.info("Sniping " + memb.user.username);
                    var str = "";
                    var sent = false;
                    for (var i = 0; i < delMsgs.length; i++) {
                        if (delMsgs[i].author.id == memb.user.id) {
                            var t = "";
                            t = t.concat("`", delMsgs[i].author.username, "` @ ", delMsgs[i].createdAt, ": `", delMsgs[i].content, "`\n");
                            if (t.length >= 200) {
                                chan.send(str);
                                str = "";
                                sent = true;
                                chan.send("`" + delMsgs[i].author.username + "` @ " + delMsgs[i].createdAt + ": `" + delMsgs[i].content.substr(0, 100) + "`\n");
                                chan.send("`" + delMsgs[i].author.username + "` @ " + delMsgs[i].createdAt + ": `" + delMsgs[i].content.substr(100) + "`\n");
                            } else if (t.length + str.length >= 200) {
                                chan.send(str);
                                str = "`" + delMsgs[i].author.username + "` @ " + delMsgs[i].createdAt + ": `" + delMsgs[i].content + "`\n";
                                sent = true;
                            } else {
                                str = str.concat(t);
                            }
                        }
                    }
                    if (str.length == 0 && !sent) {
                        chan.send("There were no messages found!");
                    } else {
                        chan.send(str);
                    }
                }
            } else {
                chan.send("You don't have permission to snipe someone!");
                logger.info("Rejected - Author Perm");
            }
            break;
        case 'verify':
            if (getPerm(receivedMessage.member, true)) {
                if (receivedMessage.mention_everyone) {
                    chan.send("I can't verify everyone");
                    logger.info("Rejected - Everyone tag");
                } else if (receivedMessage.mentions.members.first() == undefined) {
                    chan.send("No member specified");
                    logger.info("Rejected - No Mention");
                } else {
                    var targ = receivedMessage.mentions.members.first();
                    if (targ.roles.cache.has("608319663780265989")) {
                        chan.send("Member already Verified!");
                        logger.info("Rejected - Already Verified");
                    } else {
                        targ.roles.add(receivedMessage.guild.roles.cache.get("608319663780265989"));
                        chan.send("Member Verified!");
                    }
                }
            } else {
                chan.send("You don't have permission to verify someone!");
                logger.info("Rejected - Author Perm");
            }
            break;
        case 'kick':
            if (getPerm(receivedMessage.member, false)) {
                if (receivedMessage.mention_everyone) {
                    chan.send("I can't Kick everyone");
                    logger.info("Rejected - Everyone tag");
                } else if (receivedMessage.mentions.members.first() == undefined) {
                    chan.send("No member specified");
                    logger.info("Rejected - No Mention");
                } else {
                    var targ = receivedMessage.mentions.members.first();
                    if (targ.roles.cache.has("560853147367505943")) {
                        chan.send("You can't kick a staff member!");
                        logger.info("Rejected - Staff member");
                        break;
                    }
                    var reason = "";
                    if (args.length > 1) {
                        for (var i = 1; i < args.length; i++) {
                            reason = reason + args[i] + " ";
                        }
                    }
                    if (reason == "") {
                        reason = "No reason given";
                    }
                    receivedMessage.mentions.members.first().kick(reason + " - Kicked by " + receivedMessage.author.tag)
                        .then(() => {
                            chan.send("Kicked " + receivedMessage.mentions.users.first().tag + " for " + reason);
                            logger.info("Kicked " + receivedMessage.mentions.users.first().tag + " by " + receivedMessage.author.tag);
                        })
                        .catch(err => {
                            chan.send("I was unable to kick the member");
                            logger.info(err);
                        });
                    
                }
            } else {
                chan.send("You don't have permission to kick someone!");
                logger.info("Rejected - Author Perm");
            }
            break;
        case 'ban':
            if (getPerm(receivedMessage.member, false)) {
                if (receivedMessage.mention_everyone) {
                    chan.send("I can't Ban everyone");
                    logger.info("Rejected - Everyone tag");
                } else if (receivedMessage.mentions.members.first() == undefined) {
                    chan.send("No member specified");
                    logger.info("Rejected - No Mention");
                } else {
                    var targ = receivedMessage.mentions.members.first();
                    if (targ.roles.cache.has("560853147367505943")) {
                        chan.send("You can't ban a staff member!");
                        logger.info("Rejected - Staff member");
                        break;
                    }
                    var reason = "";
                    if (args.length > 1) {
                        for (var i = 1; i < args.length; i++) {
                            reason = reason + args[i] + " ";
                        }
                    }
                    if (reason == undefined) {
                        reason = "No reason given";
                    }

                    receivedMessage.mentions.members.first().ban({ reason: reason + " - Kicked by " + receivedMessage.author.tag })
                        .then(() => {
                            chan.send("Banned " + receivedMessage.mentions.users.first().tag + " for " + reason);
                            logger.info("Banned " + receivedMessage.mentions.users.first().tag + " by " + receivedMessage.author.tag);
                        })
                        .catch(err => {
                            chan.send("I was unable to ban the member");
                            logger.info(err);
                    });
                    
                }
            } else {
                chan.send("You don't have permission to ban someone!");
                logger.info("Rejected - Author Perm");
            }
            break;
        case 'reactkae':
            if (getPerm(receivedMessage.member, false) || receivedMessage.author.id == "324302699460034561") {
                if (kaeMessageReact) {
                    kaeMessageReact = false;
                    logger.info("Disabled Auto-react");
                } else {
                    kaeMessageReact = true;
                    logger.info("Enabled Auto-react");
                }
            }
        //case 'malscan':
            //if (getPerm(receivedMessage.member, true)) {
            //    msgId = args[0];
            //    if (args.length != 1 || isNaN(msgId)) {
            //        chan.send("You must pass a single message id as an argument");
            //        return
            //    }

            //    chan.fetchMessage(msgId).then(message => {
            //        var attachments = message.attachments;
            //        if (attachments.size < 1) {
            //            chan.send("The message contains no attached files");
            //        } else {

            //            var url = attachments.first().url;

            //            var defaultClient = cloudMersiveApi.ApiClient.instance;
            //            var Apikey = defaultClient.authentications['Apikey'];
            //            //Apikey.apiKey = s3.cloudmersive_token;
            //            Apikey.apiKey = auth.cloudmersive_token;

            //            var apiInstance = new cloudMersiveApi.ScanApi();
            //            var input = new cloudMersiveApi.WebsiteScanRequest();
            //            input.Url = url;

            //            apiInstance.scanWebsite(input, (error, data, response) => {
            //                if (error) {
            //                    console.error(error);
            //                } else {

            //                    var viruses = data.FoundViruses;

            //                    var result = new Discord.RichEmbed()
            //                        .setTitle("Scan resuts")
            //                        .addField("Safe file", data.CleanResult);

            //                    for (var i = 0; viruses && i < viruses; i++) {
            //                        result.addField(viruses[i].FileName, viruses[i].VirusName);
            //                    }

            //                    chan.send(result);
            //                }
            //            });
            //        }
            //    });
            //}
            //break;
    }
}

bot.on('message', (receivedMessage) => {
    if (receivedMessage.author == bot.user) {
        return
        //prevent responding to its own message
    }
    if (receivedMessage.content.substring(0, 1) == ".") {
        if (active && receivedMessage.guild != null) {
            process(receivedMessage);
        } else {
            if (receivedMessage.author.id == "324302699460034561") {
                process(receivedMessage);
            } else {
                return
            }
        }

    } else {
        if ((receivedMessage.author.id == 259573995710447616 || receivedMessage.author.id == 324302699460034561) && kaeMessageReact) {
            receivedMessage.react(receivedMessage.guild.emojis.cache.get("760060061225189416"));
        }
    }
})

bot.on('messageDelete', (delmsg) => {
    if (delmsg.author.id == "350823530377773057") {
        return
    } else {
        delMsgs.unshift(delmsg);
        logger.info("Deleted Message Logged");
        if (delMsgs.length > 50) {
            delMsgs.pop();
        }
    }
})

bot.on('guildMemberUpdate', (oldUser, newUser) => {
    if (oldUser.nickname == newUser.nickname || newUser.nickname == null) {
        return;
    } else if (newUser.id !== "623848021255520295" || newUser.id !== "285475344817848320") {
        if (namecheck(newUser.nickname)) {
            newUser.setNickname("Please use ASCII characters");
            logger.info("Force changed a user's nickname to ASCII characters");
        }
    }
})

bot.on('guildMemberAdd', (member) => {
    if (member.user.username == "username123" || member.user.username == "_username1.2.3_") {
        member.ban({ reason: "Shared Ban List - username123" });
        logger.info("Banned username123");
    }
    if (namecheck(member.user.username)) {
        member.setNickname("Please use ASCII characters");
        logger.info("Force Changed a new user's nickname to ASCII characters");
    }
})