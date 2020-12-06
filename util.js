// Set of utility functions for Lockebot
const config = require('./config.json')
const package = require('./package.json')


function getPerm(member, boolHelp) {
    if (member.roles.cache.has(config.modRoleID) || member.roles.cache.has(config.dadminRoleID) || member.roles.cache.has(config.adminRoleID)) {
        return true;
    } else if (member.roles.cache.has(config.helperRoleID) && boolHelp) {
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
            { name: 'verify', value: 'verifies a user, must be a staff member' },
            { name: 'kick', value: 'Kicks a user from the server, must be a Mod/Admin' },
            { name: 'ban', value: 'Bans a user from the server, must be a Mod/Admin' },
            { name: 'Help', value: 'Displays this Message' })
        .setFooter("v" + package.version + " -- Developed by HKing#9193");

    chan.send(embed);
}

function isBlacklisted(filename) {
    for (let i = 0; i < file_blacklist.length; i++) {
        if (filename.endsWith(file_blacklist[i]))
            return true
    }

    return false
}

function filterAttachment(message) {
    let abuseAttachement = message.attachments.find(attachment => isBlacklisted(attachment.name))
    if (abuseAttachement !== undefined) {
        message.delete()
            .then(msg => msg.channel.send(`Sorry ${msg.author}, I deleted file because it's file-type `
                + "is blacklisted in our spam filter"))
        return true
    }

    return false
}

exports.getPerm = getPerm;
exports.help = help;
exports.filterAttachment = filterAttachment;