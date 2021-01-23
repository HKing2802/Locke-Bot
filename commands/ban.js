/* Command to ban a member
 */
const { getPerm, getReason, log } = require('../src/util.js');
require('hjson/lib/require-config');
const config = require('../config.hjson');
const { GuildMember, Message } = require('discord.js');
const moment = require('moment');
const db = require('../src/db.js');
const auto_unmute = require('../modules/timed/auto-unmute.js');
const auto_unban = require('../modules/timed/auto-unban.js');

// Command information
const name = "ban";
const description = "Bans a member from the server";
const usage = `${config.prefix}ban <member mention> [reason]` +
    '\n' + `${config.prefix}ban <member ID> [reason]`;
const type = "Moderation";

/**
 * Parses the time argument to get a timestamp when the member is meant to be unbanned
 * @param {Array<string>} args The arguments provided to the command and split by processor
 * @param {Discord.GuildMember} target The target member of the ban
 * @returns {Object<string, string, moment.Moment>}
 */
function parseTime(args, target) {
    let arg;
    const name = `<@!${target.id}>`;
    const id = `${target.id}`;
    if (args[0] === undefined) return;
    if (!args[1]) {
        if (args[0].length > name.length || args[0].length > id.length) {
            arg = args[0];
        } else {
            return;
        }
    } else {
        arg = args[1];
    }

    let re = /\d+[a-zA-Z]{0,1}$/g;
    arg = arg.match(re);
    if (!arg || !arg[0]) return;

    if (arg[0].length > id.length) arg = arg[0].substr(id.length);
    else if (arg[0].length == id.length && arg[1]) arg = arg[1];
    else arg = arg[0];

    const numRe = /\d+/g
    const charRe = /[a-zA-Z]{1}\b/g;

    const time = arg.match(numRe);
    let unit = arg.match(charRe);
    if (!unit) unit = ['m'];

    const timeUnban = moment();
    timeUnban.add(time[0], unit[0]);
    return { time: time[0], unit: unit[0], timeUnban: timeUnban };
}

/**
 * Checks to ensure that the target can be banned, and performs the ban
 * @param {Message} message The message received by the bot
 * @param {Array<string>} args The arguments provided to the command and split by processor
 * @param {GuildMember} target The target member to ban
 * @returns {Promise<boolean>}
 */
async function ban(message, args, target) {
    if (getPerm(target, true)) {
        return message.channel.send("Can't ban a staff member")
            .then(() => { return false });
    }

    const banTime = parseTime(args, target);

    let reason;
    if (banTime) reason = getReason(args, target, 2);
    else reason = getReason(args, target);

    if (reason == "") reason = "No reason given";

    // inserts into database if time provided
    if (banTime) {
        if (!db.connected()) log(`Not Connected to database. Skipping database entry...`, message.client, false, 'warn');
        else {
            const timeUnban = `'${banTime.timeUnban.format('YYYY-MM-DD HH:mm:ss')}'`;
            const timeBan = `'${moment().format('YYYY-MM-DD HH:mm:ss')}'`;
            await db.buildQuery(`INSERT INTO temp_ban(user_id, time_banned, time_unban) VALUES (${target.id}, ${timeBan}, ${timeUnban})`)
                .execute()
                .catch(err => { log(`Error in querying database in ban: ${err}`, message.client, false, 'error') });
            log('Logged temporary banned user to database');
        }
    }

    // constructs DM
    let DMmsg = `You have been banned in Locke`;
    if (reason !== "No reason given") DMmsg += ` for ${reason}`;
    if (banTime) DMmsg += `\nYou will be unbanned in ${banTime.timeUnban.toNow(true)}`;

    /// sends DM message
    target.user.createDM()
        .then(async (DMchan) => {
            await DMchan.send(DMmsg);
            target.user.deleteDM();
        })
        .catch(err => { log(`Error in sending DM message: ${err}`, message.client, false, 'error') });

    // executes ban
    return target.ban({ reason: `${reason} - Banned by ${message.author.tag}` })
        .then((m) => {
            let tag;
            if (m.user == undefined) {
                if (m.tag == undefined) {
                    tag = m;
                } else {
                    tag = m.tag;
                }
            } else {
                tag = m.user.tag;
            }

            // tells auto-unmute and auto-unban to update
            auto_unmute.events.emit('update');
            auto_unban.events.emit('update');

            // constructs message
            let msg = `Banned ${tag}`;
            if (banTime) msg += ` for ${banTime.timeUnban.toNow(true)}`;
            if (reason == "No reason given") msg += `, No reason given.`;
            else msg += ` for ${reason}`;

            return message.channel.send(msg)
                .then(() => {
                    log(`${message.author.tag} banned ${tag} for ${reason}`, message.client, true);
                    return true;
                });
        })
        .catch(err => {
            return message.channel.send(`Unable to ban the member`)
                .then(() => {
                    log(`Unable to ban member ${target.user.tag} By: ${message.author.tag} Reason: ${reason} Error: ${err}`, undefined, false, 'error');
                    return false;
                });
        });
};

/**
 * Checks message author permission and if a mention/ID is given
 * @param {Message} message The message received by the bot
 * @param {Array<string>} args The arguments provided to the command and split by processor
 * @returns {Promise<boolean|undefined>}
 */
async function main(message, args) {
    if (getPerm(message.member)) {
        if (message.mentions.everyone) {
            return message.channel.send("I can't Ban everyone")
                .then(() => { return false });
        } else {
            const target = message.guild.members.resolve(message.mentions.members.first())
            if (target) return await ban(message, args, target);
            const IDtarget = message.guild.members.resolve(args[0]);
            if (IDtarget) return await ban(message, args, IDtarget);
            else {
                return message.channel.send("No member or ID specified")
                    .then(() => { return false });
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
    ban: ban,
    parseTime, parseTime
}