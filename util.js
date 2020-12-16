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

/**
 * Constructs a map of ids for logging channels. Returns Map<GuildID, ChannelID> or string on error
 * @param {Array<Array<string>>} idList Nested array that contains [GuildID, ChannelID]
 * @returns {Map<string, string>|string}
 */
function getLogChannels(idList) {
    if (!(Array.isArray(idList))) {
        return `Logging channel not set up properly, array is of type ${typeof idList}`;
    } else if (idList.length <= 0) {
        return "Logging channel idList is empty";
    } else if (!(Array.isArray(idList[0]))) {
        return `Logging channel not set up properly, array is of type ${typeof idList[0]}`;
    } else {
        return new Map(idList);
    }
}

/**
 * Logs a message to the console, logging channels and file logs.
 * @param {string} content The content of the log message
 * @param {Discord.Client} [client] The instantiating client, can be omitted if not logging to channels
 * @param {boolean} [channel] Boolean if the message is also logged to logging channels
 * @param {string} [level] The level of the log, can be info, warn or error. Defaults to info
 * @param {Map<string, string>} logChannelOverride A map of <GuildID, ChannelID> to override the default logging channels defined in the cofig.
 * @returns {void}
 */
function log(content, client, channel = true, level = 'info', logChannelOverride) {
    // Checks if logging channel ids are loaded and loads if not present or if there is an override provided
    let logChannels;
    logChannelOverride ? logChannels = logChannelOverride : logChannels = LOG_CHANNELS;
    if (!logChannels) {
        logChannels = getLogChannels(config.logChannels);
        if (!(logChannels instanceof Map)) {
            channel = false;
            logger.warn(`Could not load logging channel ids: ${logChannels}, skipping channel log...`);
        }
    }

    // overwrites the global config if log channels were updated and override is not given
    if (!logChannelOverride && logChannels != LOG_CHANNELS) LOG_CHANNELS = logChannels;

    // logs to console
    switch (level) {
        case 'warn':
            logger.warn(content);
            break;
        case 'error':
            logger.error(content);
            break;
        case 'info':
        default:
            logger.info(content);
            break;
    }

    // logs to channel
    if (channel && client) {
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