// Set of utility functions for Lockebot
const config = require('./config.json');
const Discord = require('discord.js');
const winston = require('winston');
const file_blacklist = require('./file_blacklist.json');
require('winston-daily-rotate-file');

// Initializes the logger and transports
const defaultLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
            filename: './logs/error.log',
            level: 'error'
        }),
        new winston.transports.DailyRotateFile({
            frequency: '1d',
            filename: 'LockeBot-logs-%DATE%.log',
            dirname: '.\\logs\\',
            datePattern: 'YYYY-MM-DD',
            maxFiles: '10d'
        })
    ]
})

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
 * @returns {Array<Array<string>>|string}
 */
function checkLogChannels(idList) {
    if (!(Array.isArray(idList))) {
        return `Logging channel not set up properly, parameter is of type ${typeof idList}`;
    } else if (idList.length <= 0) {
        return "Logging channel Array is empty";
    } else if (!(Array.isArray(idList[0]))) {
        return `Logging channel not set up properly, array is of type ${typeof idList[0]}`;
    } else {
        return idList;
    }
}

/**
 * Logs a message to the console, logging channels and file logs.
 * @param {string} content The content of the log message
 * @param {Discord.Client} [client] The instantiating client, can be omitted if not logging to channels
 * @param {boolean} [channel] Boolean if the message is also logged to logging channels
 * @param {string} [level] The level of the log, can be info, warn or error. Defaults to info
 * @param {Array<Array<string>>} [logChannelOverride] A nested array that contains [[GuildID, ChannelID], ...] to override the default logging channels defined in the cofig
 * @param {Winston.logger} [logger] The logger and transports for the function to log to
 * @returns {Promise<Discord.Message>|Promise<undefined>}
 */
async function log(content, client, channel = true, level = 'info', logChannelOverride, logger = defaultLogger) {
    // Checks if logging channel ids are loaded and loads if not present or if there is an override provided
    let logChannels;
    if (logChannelOverride) logChannels = logChannelOverride;
    if (!logChannels) {
        logChannels = checkLogChannels(config.logChannel);
        if (!(Array.isArray(logChannels))) {
            channel = false;
            logger.warn(`Could not load logging channel ids: ${logChannels}. Skipping channel log...`);
        }
    } else if (logChannelOverride && logChannels) {
        logChannels = checkLogChannels(logChannels);
        if (!(Array.isArray(logChannels))) {
            channel = false;
            logger.warn(`Could not load logging channel override ids: ${logChannels}. Skipping channel log...`);
        }
    }

    // logs to console
    logger.log(level, content);

    // logs to channel
    if (channel && client) {
        return await Promise.all(logChannels.map(async (arr) => {
            const guild = client.guilds.cache.get(arr[0]);
            if (!guild) {
                logger.warn(`Could not load guild for ID ${arr[0]} and channel ID ${arr[1]}`);
            } else {
                const channel = guild.channels.cache.get(arr[1]);
                if (!channel) {
                    logger.warn(`Could not load channel for ID ${arr[1]} in guild ${guild.name}`);
                } else {
                    return channel.send(content)
                        .then((m) => { return m });
                }
            }
        }));
    }
}

exports.getPerm = getPerm;
exports.filterAttachment = filterAttachment;
exports.log = log;
exports.testing = {
    checkLogChannels: checkLogChannels
};