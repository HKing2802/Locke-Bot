// Set of utility functions for Lockebot
const config = require('./config.js');
const Discord = require('discord.js');
const winston = require('winston');
const file_blacklist = require('../file_blacklist.json');
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
            dirname: 'logs',
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
    if (member.roles.cache.has(config.getConfig('modRoleID')) || member.roles.cache.has(config.getConfig('dadminRoleID')) || member.roles.cache.has(config.getConfig('adminRoleID'))) {
        return true;
    } else if (member.roles.cache.has(config.getConfig('helperRoleID')) && boolHelp) {
        return true;
    } else if (member.guild.ownerID == member.id) {
        return true;
    }
    
    return false;
}

/**
 * Gets the reason for the command from the arguments
 * Strips the mention or ID of the member/user
 * @param {Array<string>} args The arguments provided to the command and split by processor
 * @param {GuildMember} target The target of the command
 * @param {number} startIndex The starting index of the args 
 * @returns {string}
 */
function getReason(args, target, startIndex=0) {
    const name = `<@!${target.id}>`;
    const id = `${target.id}`;
    let reason = "";

    for (let i = startIndex; i < args.length; i++) {
        if (args[i].indexOf(name) == -1) {
            if (args[i].indexOf(id) == -1)
                reason += `${args[i]} `;
            else
                reason += `${args[i].substr(id.length)} `;
        } else
            reason += `${args[i].substr(name.length)} `;
        return reason.trim();
    }
}

/**
 * Checks if a file ends with a certain extension
 * @param {string} filename - filename to check
 * @returns {boolean}
 */
function isBlacklisted(filename) {
    for (let i = 0; i < file_blacklist.length; i++) {
        if (filename.toLowerCase().endsWith(file_blacklist[i]))
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
    let abuseAttachment = message.attachments.find(attachment => isBlacklisted(attachment.name))
    if (abuseAttachment !== undefined) {
        return message.delete()
            .then(msg => {
                msg.channel.send(`Sorry ${msg.author.tag}, I deleted that file because its file-type `
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
 * @param {boolean} [allChannels] Boolean if the message is logged to All logging channels, or only extra info ones
 * @param {string} [level] The level of the log, can be info, warn or error. Defaults to info
 * @param {Array<Array<string>>} [logChannelOverride] A nested array that contains [[GuildID, ChannelID], ...] to override the default logging channels defined in the cofig
 * @param {Winston.logger} [logger] The logger and transports for the function to log to
 * @returns {Promise<Discord.Message>|Promise<undefined>}
 */
async function log(content, client, allChannels = true, level = 'info', logChannelOverride, logger = defaultLogger) {
    // logs to console if not an embed
    if (!(content instanceof Discord.MessageEmbed)) logger.log(level, content);

    // logs to channel
    if (client) {
        // Checks if logging channel ids are loaded and loads if not present or if there is an override provided
        let logChannels;
        if (logChannelOverride) logChannels = logChannelOverride;
        if (!logChannels) {
            logChannels = checkLogChannels(config.getConfig('logChannel'));
            if (!(Array.isArray(logChannels))) {
                logger.warn(`Could not load logging channel ids: ${logChannels}. Skipping channel log...`);
                return;
            }
        } else if (logChannelOverride && logChannels) {
            logChannels = checkLogChannels(logChannels);
            if (!(Array.isArray(logChannels))) {
                logger.warn(`Could not load logging channel override ids: ${logChannels}. Skipping channel log...`);
                return;
            }
        }

        return await Promise.all(logChannels.map(async (arr) => {
            client.guilds.fetch(arr[0]).then((guild) => {
                if (!guild) {
                    logger.warn(`Could not load guild for ID ${arr[0]} and channel ID ${arr[1]}`);
                } else {
                    guild.channels.fetch(arr[1]).then((channel) => {
                        if (!channel) {
                            logger.warn(`Could not load channel for ID ${arr[1]} in guild ${guild.name}`);
                        } else {
                            if (allChannels || (config.getConfig('allInfoLogsChannels').includes(channel.id) && level === 'info') || (config.getConfig('allErrorLogsChannels').includes(channel.id) && level !== 'info')) {
                                return channel.send(content)
                                    .then((m) => { return m });
                            }
                        }
                    });
                }
            });
        }));
    }
}

/**
 * Helper function to silence the winston logger during testing
 * @param {boolean} state The state of the transport silent flag
 */
function silenceLogging(state) {
    if (typeof state != 'boolean') return;
    defaultLogger.transports.forEach((t) => {t.silent = state})
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    });
}

exports.getPerm = getPerm;
exports.filterAttachment = filterAttachment;
exports.log = log;
exports.getReason = getReason;
exports.sleep = sleep;
exports.testing = {
    checkLogChannels: checkLogChannels,
    silenceLogging: silenceLogging
}