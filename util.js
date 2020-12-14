// Set of utility functions for Lockebot
const config = require('./config.json');
const Discord = require('discord.js');

/**
 * Checks the permissions of the member
 * Function specific to Locke
 * @param {Discord.GuildMember} member The member to check
 * @param {boolean} boolHelp Boolean if helpers will pass the check
 * @returns {boolean}
 */
function getPerm(member, boolHelp) {
    if (member.roles.cache.has(config.modRoleID) || member.roles.cache.has(config.dadminRoleID) || member.roles.cache.has(config.adminRoleID)) {
        return true;
    } else if (member.roles.cache.has(config.helperRoleID) && boolHelp) {
        return true;
    } else {
        return false;
    }
}

/**
 * Checks if a file ends with a certain extension
 * @param {string} filename - filename to check
 * @returns {boolean}
 */
function isBlacklisted(filename) {
    for (let i = 0; i < file_blacklist.length; i++) {
        if (filename.endsWith(file_blacklist[i]))
            return true
    }
    return false
}

/**
 * Checks and deletes a message if the attached file is blacklisted
 * @param {Discord.Message} message The message to check
 * @returns {boolean}
 */
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
exports.filterAttachment = filterAttachment;