// Set of utility functions for Lockebot
const config = require('./config.json');
const Discord = require('discord.js');
const logger = require('winston');
const file_blacklist = require('./file_blacklist.json');

let LOG_CHANNELS;

// Initializes the logger transport
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

/**
 * Checks the permissions of the member
 * Function specific to Locke
 * @param {Discord.GuildMember} member The member to check
 * @param {boolean} [boolHelp] Boolean if helpers will pass the check
 * @returns {boolean}
 */
function getPerm(member, boolHelp=false) {
    if (member.roles.cache.has(config.modRoleID) || member.roles.cache.has(config.dadminRoleID) || member.roles.cache.has(config.adminRoleID)) {
        return true;
    } else if (member.roles.cache.has(config.helperRoleID) && boolHelp) {
        return true;
    } else if (member.guild.ownerID == member.id) {
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
            return true;
    }
    return false;
}

/**
 * Checks and deletes a message if the attached file is blacklisted
 * @param {Discord.Message} message The message to check
 * @returns {Promise<boolean>}
 */
async function filterAttachment(message) {
    let abuseAttachement = message.attachments.find(attachment => isBlacklisted(attachment.name))
    if (abuseAttachement !== undefined) {
        return message.delete()
            .then(msg => {
                msg.channel.send(`Sorry ${msg.author.tag}, I deleted that file because it's file-type `
                    + "is blacklisted in our spam filter")
                return true;
            });
    } else {
        return false;
    }
}

function getLogChannels(idList) {
    if (!(Array.isArray(idList))) {
        logger.warn(`Logging channel not set up properly, array is of type ${typeof idList}`);
        return undefined;
    } else if (idList.length <= 0) {
        logger.warn("Logging channel idList is empty");
        return undefined;
    } else if (!(Array.isArray(idList[0]))) {
        logger.warn(`Logging channel not set up properly, array is of type ${typeof idList[0]}`);
        return undefined;
    } else {
        return new Map(idList);
    }
}

function log(client, content, channel = true, logChannelOverride) {
    // Checks if logging channel ids are loaded and loads if not present or if there is an override provided
    let logChannels;
    logChannelOverride ? logChannels = logChannelOverride : logChannels = LOG_CHANNELS;
    if (!logChannels) {
        logChannels = getLogChannels(config.logChannels);
        if (!logChannels) {
            channel = false;
            logger.warn("Could not load logging channel ids, skipping channel log...");
        }
    }

    // overwrites the global config if log channels were updated and override is not given
    if (!logChannelOverride && logChannels != LOG_CHANNELS) LOG_CHANNELS = logChannels;

    // logs to console
    logger.info(content);

    // logs to channel
    if (channel) {
        logChannels.forEach((value, key, map) => {
            const guild = client.guilds.fetch(key);
            if (!guild) {
                logger.warn(`Could not load guild for ID ${key} and channel id ${value}`)
            } else {
                const channel = guild.channels.fetch(value);
                if (!channel) {
                    logger.warn(`Could not load channel for ID ${key} in guild ${guild.name}`);
                } else {
                    channel.send(content);
                }
            }
        })
    }
}

exports.getPerm = getPerm;
exports.filterAttachment = filterAttachment;
exports.getLogChannels = getLogChannels;
exports.log = log;