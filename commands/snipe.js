/* Command to get a member's deleted messages
 */
const db = require('../src/db.js');
require('hjson/lib/require-config');
const config = require('../config.hjson');
const persistent = require('../persistent.json');
const { log } = require('../src/util.js');
const { Message, GuildMember, TextChannel } = require('discord.js');
const moment = require('moment');
const fs = require('fs');

// Command Information
const name = 'snipe';
const description = `Gets the user's deleted messages. Displays the last ${config.snipeMessages} messages by default`;
const usage = `${config.prefix}snipe <member mention> [options]` +
    '\n' + `${config.prefix}snipe <member ID> [options]` +
    '\n' + `Options: \`all\` - displays all deleted messags`;
const type = "Moderation";

/**
 * Escapes pings from message content so that the member is not pinged
 * @param {string} content
 * @returns {string}
 */
function escapeMessage(content, guild) {
    // Searches the message and removes the <> around pings
    const pingRegex = /<@[!&]\d+>/g;

    let i = content.search(pingRegex);
    while (i != -1) {
        const ping = content.substring(i, i + 22);
        const id = ping.substring(3, 21);

        if (content[i + 2] == '!') {
            let tag;
            if (!guild) tag = id;
            else {
                const member = guild.members.fetch(id);
                if (!member) tag = id;
                else tag = member.user.tag;
            }
            content = content.replace(ping, `@${tag}`);

        } else if (content[i + 2] == '&') {
            let tag;
            if (!guild) tag = id;
            else {
                const role = guild.roles.cache.get(id);
                if (!role) tag = id;
                else tag = role.name;
            }
            content = content.replace(ping, `@${tag}`);
        }

        i = content.search(pingRegex);
    }

    const evRegex = /@everyone/g
    let j = content.search(evRegex);
    while (j != -1) {
        const ping = content.substring(j, j + 9);
        content = content.replace(ping, '@?everyone');
        j = content.search(evRegex);
    }

    const hereRegex = /@here/g;
    let k = content.search(hereRegex);
    while (k != -1) {
        const ping = content.substring(k, k + 5);
        content = content.replace(ping, `@?here`);
        k = content.search(hereRegex);
    }

    return content;
}

/**
 * Takes an array of strings and appends them together in the most-efficient way to send messages while retaining order
 * @param {Array<string>} contents Array of ordered strings that are the content for the large message
 * @param {TextChannel} channel The channel to send the messages to
 * @returns {Promise<Array<Message>>}
 */
async function sendLargeMessage(contents, channel) {
    let msgBuffer = [];
    let currentMsg = '';

    for (let c of contents) {
        if (currentMsg.length + c.length > 2000) {
            msgBuffer.push(currentMsg);
            currentMsg = `${c}\n`;
        } else currentMsg += `${c}\n`;
    }
    if (currentMsg.length > 0) msgBuffer.push(currentMsg);

    if (msgBuffer.length <= 0) return false;

    let msgs = [];
    for (let msg of msgBuffer) {
        msgs.push(await channel.send(msg.trimEnd()));
    }
    return msgs;
}

/**
 * Collects and sends the deleted messages of a member
 * @param {Message} message The message received by the bot
 * @param {Array<string>} args The arguments provided to the command and split by processor
 * @param {GuildMember} target The target member to get deleted messages
 * @returns {Promise<boolean>}
 */
async function getDeleted(message, args, target) {
    // gets max munber of messages to display
    let msgLimit = config.snipeMessages;
    if (args[1] == 'all') msgLimit = 50;

    // checks if connected to database
    if (!(db.connected())) {
        log(`Snipe not Connected to Database`, message.client, false, 'error');
        return false;
    }

    // Gets all deleted messages and stores them in msgBuffer
    // msgBuffer is Map<number, string>
    const msgBuffer = new Map();
    await db.buildQuery(`SELECT id, send_time, content FROM messages WHERE user_id = ${target.id} LIMIT ${msgLimit}`)
        .execute(result => {
            msgBuffer.set(result[0], [result[1], result[2]]);
        })
        .catch(err => {
            log(`Error in Snipe query: ${err}`, message.client, false, 'error');
            return false;
        });

    // checks if no messages are found
    if (msgBuffer.size == 0) {
        message.channel.send('No messages found');
        return true;
    }

    // constructs outgoing contents with timestamp and escaped content
    msgContents = [];
    persistent.snipeData.msgs = [];
    for (let id of msgBuffer.keys()) {
        persistent.snipeData.msgs.push(id);
        delContent = msgBuffer.get(id);
        msgContents.push(`[${msgContents.length + 1}] ${moment(delContent[0]).add(5, 'h').format('MM/DD H:mm:ss')} - ${escapeMessage(delContent[1])}`)
    }

    // saves data to persistent
    persistent.snipeData.time = moment().valueOf();
    await fs.writeFile('./persistent.json', JSON.stringify(persistent, null, 2), (err) => {
        if (err) log(`Error in writing persistent data for snipe`, message.client, false, 'error');
    });

    // sends deleted messages
    return sendLargeMessage(msgContents, message.channel)
        .then((msgs) => {
            log(`Sent deleted messages in ${msgs.length} messages`);
            return true;
        })
        .catch(err => {
            log(`Error in sending deleted messages: ${err}`, message.client, false, 'error');
            return false;
        });
}

async function getEdits(message, args, editNum) {
    
}

async function main(message, args) {

}

/*
 * Two modes - general or edit
 * 
 * function to iterate through message and escape all pings
 * 
 * general
 *      takes a mention/id as argument
 *      gets and displays the last <config> messages
 *      optional argument 'all' for all messages
 *      formats them: MM/DD HH:mm:ss - <message>
 *      orders deleted messages with first printed being newest
 *      checks message length and has an array of message contents
 *      sends all messages in order
 * 
 * edit
 *      Stores last general mode response message ID in persistent
 *      takes a message number as argument
 *      gets and displays all edits
 *      shows full timestamp
 *      shows where it was deleted? - would need to add to table
 *      orders edits current at top, just below information
 *      sends message like general
 */

exports.main = main;
exports.testing = {
    escapeMessage: escapeMessage,
    sendLargeMessage: sendLargeMessage,
    getDeleted: getDeleted,
    getEdits: getEdits
}