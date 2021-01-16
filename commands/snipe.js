/* Command to get a member's deleted messages
 */
const db = require('../src/db.js');
require('hjson/lib/require-config');
const config = require('../config.hjson');
const persistent = require('../persistent.json');
const { log, getPerm } = require('../src/util.js');
const { Message, GuildMember, TextChannel } = require('discord.js');
const moment = require('moment');
const fs = require('fs');

// Command Information
const name = 'snipe';
const description = `Gets the user's deleted messages. Displays the last ${config.snipeMessages} messages by default.\nCan also show the previous edits of a deleted message, where number is the number to the left of each deleted message`;
const usage = `${config.prefix}snipe <member mention|member ID> [options] - Gets Deleted messages` +
    '\n' + `${config.prefix}snipe edits <number> [options] - Gets edits of a deleted message` +
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
    // msgBuffer is Map<number, Array<number, string>>
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
    let msgContents = [];
    persistent.snipeData.msgs = [];
    for (let id of msgBuffer.keys()) {
        persistent.snipeData.msgs.push(id);
        let delContent = msgBuffer.get(id);
        msgContents.push(`[${msgContents.length + 1}] ${moment(delContent[0]).add(5, 'h').format('M/DD H:mm:ss')} - ${escapeMessage(delContent[1], message.guild)}`)
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
    const persistent = require('../persistent.json'); // ensures data is the most up to date

    // checks if snipe has been used to get deleted messages in the past 30 minutes
    const delMsgTime = moment(persistent.snipeData.time);
    if (moment().diff(delMsgTime, 'm', true) > 30) {
        message.channel.send(`Snipe has not been used to get deleted messages in the past half-hour`);
        return false;
    }

    // gets and checks the message ID
    const msgID = persistent.snipeData.msgs[editNum - 1];
    if (msgID === undefined) {
        message.channel.send(`Incorrect message number: must be within 1-${persistent.snipeData.msgs.length}`);
        return false;
    }

    // gets max number of edits to display
    let editLimit = config.snipeMessages;
    if (args[2] == 'all') editLimit = 50;

    // gets all edits and stores them in editBuffer
    // editBuffer is Map<number, Array<number, string>>
    let extraEdits = 0;
    const editBuffer = new Map();
    await db.buildQuery(`SELECT num, edit_time, content FROM edits WHERE msg_id = ${msgID}`)
        .execute(result => {
            if (editBuffer.size >= editLimit) extraEdits += 1;
            else editBuffer.set(result[0], [result[1], result[2]]);
        })
        .catch(err => {
            log(`Error in Snipe Edits query: ${err}`, message.client, false, 'error');
            return false;
        });

    // gets message data
    let messageData;
    await db.buildQuery(`SELECT user_id, channel_id, send_time, delete_time, content FROM messages WHERE id = ${msgID} LIMIT 1`)
        .execute(result => {
            messageData = result;
        })
        .catch(err => {
            log(`Error in getting Edit message data: ${err}`, message.client, false, 'error');
            return false;
        });

    // checks message data
    if (!messageData) {
        log(`Could not get edit message data`, message.client, false, 'error');
        return false;
    }

    // configures data for display
    let channel = message.guild.channels.cache.get(messageData[1]);
    let member = message.guild.members.cache.get(messageData[0]);
    channel ? channel = `#${channel.name}` : channel = "???";
    member ? member = `@${member.user.tag}` : member = "???";
    const delTimestamp = moment(messageData[3]).add('5', 'h').format('YYYY-MM-DD HH:mm:ss');
    const sendTimestamp = moment(messageData[2]).add('5', 'h').format('YYYY-MM-DD HH:mm:ss');

    // constructs outgoing contents
    let editContents = [];
    editContents.push(`Sent At:\t\t ${sendTimestamp}\t\tAuthor:\t ${member}\nDeleted At:   ${delTimestamp}\t\tChannel:   ${channel}`);
    if (editBuffer.size > 0) {
        editContents.push(`Oldest`)
        for (let num of editBuffer.keys()) {
            let editContent = editBuffer.get(num);
            let editTimestamp = moment(editContent[0]).add('5', 'h').format('YYYY-MM-DD H:mm:ss');
            editContents.push(`[${num}] ${editTimestamp} - ${escapeMessage(editContent[1], message.guild)}`);
        }
        if (extraEdits > 0) {
            let g = 'Edit';
            if (extraEdits > 1) g = 'Edits'
            editContents.push(`--- ${extraEdits} More ${g} not Shown ---`);
        }
        editContents.push(`${sendTimestamp} - ${escapeMessage(messageData[4], message.guild)}`)
        editContents.push(`Current`)
    } else {
        editContents.push(`No edits found`);
        editContents.push(`${sendTimestamp} - ${escapeMessage(messageData[4], message.guild)}`)
    }

    // sends edits
    return sendLargeMessage(editContents, message.channel)
        .then((msgs) => {
            log(`Info & Edits sent in ${msgs.length} messages`);
            return true
        })
        .catch(err => {
            log(`Error in sending edits message: ${err}`, message.client, false, 'error');
            return false;
        });
}

async function main(message, args) {
    if (getPerm(message.member)) {
        if (message.mentions.everyone) {
            return message.channel.send("I can't snipe everyone")
                .then(() => { return false });
        } else {
            if (args[0] == 'edits') {
                const num = parseInt(args[1]);
                if (Number.isNaN(num)) {
                    return message.channel.send('Argument provided is not a number')
                        .then(() => { return false });
                } else {
                    return await getEdits(message, args, num);
                }
            } else {
                const target = message.guild.members.resolve(message.mentions.members.first());
                if (target) return await getDeleted(message, args, target);
                const IDtarget = message.guild.members.resolve(args[0]);
                if (IDtarget) return await getDeleted(message, args, IDtarget);
                else {
                    return message.channel.send("No member or ID specified")
                        .then(() => { return false });
                }
            }
        }
    }
}

exports.main = main;
exports.name = name;
exports.data = {
    description: description,
    usage: usage,
    type: type
}
exports.testing = {
    escapeMessage: escapeMessage,
    sendLargeMessage: sendLargeMessage,
    getDeleted: getDeleted,
    getEdits: getEdits
}