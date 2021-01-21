/* Command to mute a member
 */
require('hjson/lib/require-config');
const config = require('../config.hjson');
const db = require('../src/db.js');
const { getPerm, log, getReason } = require('../src/util.js');
const moment = require('moment');
const Discord = require('discord.js');
const auto_unmute = require('../modules/timed/auto-unmute.js');

const name = 'mute';
const desc = "Mutes a member";
const usage = `${config.prefix}mute <member mention> [duration] [reason]`
    + '\n' + `${config.prefix}mute <member ID> [duration] [reason]`;
const type = "Moderation";

/**
 * Parses the time argument to get a timestamp when the member is meant to be unmuted
 * @param {Array<string>} args The arguments provided to the command and split by processor
 * @param {Discord.GuildMember} target The target member of the mute
 * @returns {Object<string, string, moment>}
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

    const timeUnmute = moment();
    timeUnmute.add(time[0], unit[0]);
    return { time: time[0], unit: unit[0], timeUnmute: timeUnmute };
}

/**
 * Checks permissions of the target and carries out the role exchange
 * @param {Discord.Message} message
 * @param {Array<string>} args
 * @param {Discord.GuildMember} target
 */
async function mute(message, args, target) {
    if (getPerm(target)) {
        return message.channel.send("Can't mute a staff member")
            .then(() => { return false });
    }

    const muteTime = parseTime(args, target);
    let member = false;

    let reason;
    if (muteTime) reason = getReason(args, target, 2);
    else reason = getReason(args, target);

    if (reason == "") reason = "No reason given";
    if (target.roles.cache.has(config.memberRoleID)) member = true;

    // adds role
    const role = message.guild.roles.cache.get(config.mutedRoleID);
    await target.roles.add(role);

    // removes role(s)
    await target.roles.remove(message.guild.roles.cache.get(config.humanRoleID));
    if (member) await target.roles.remove(message.guild.roles.cache.get(config.memberRoleID));

    // constructs response message
    let msg = `Muted ${target.user.tag}`;
    if (muteTime) msg += ` for ${muteTime.timeUnmute.toNow(true)}`;
    if (reason == "No reason given") msg += ', No reason given';
    else msg += ` for ${reason}`;

    // adds to db
    if (!db.connected()) log(`Not Connected to database. Skipping database entry...`, message.client, false, 'warn');
    else {
        // sets timeUnmute to formatted time if exists, or undefined otherwise
        let timeUnmute = 'NULL';
        if (muteTime) timeUnmute = `'${muteTime.timeUnmute.format('YYYY-MM-DD HH:mm:ss')}'`;

        if (member) member = 1;
        else member = 0;

        // Builds and executes query to Database
        db.buildQuery(`INSERT INTO muted_users(user_id, name, member, time_unmute) VALUES (${target.id}, '${target.user.username}', ${member}, ${timeUnmute})`)
            .execute()
            .catch(err => { log(`Error in querying database in mute: ${err}`, message.client, false, 'error'); });
        log('Logged muted user to Database');
    }

    // tells auto-unmute to update
    auto_unmute.events.emit('update');

    // logs info
    let logmsg = `${message.author.tag} muted ${target.user.tag} for ${reason}`;
    if (muteTime) logmsg += `Time: ${muteTime.timeUnmute.format()}`;
    log(logmsg);

    // constructs log embed
    const logEmbed = new Discord.MessageEmbed()
        .setAuthor(message.author.tag)
        .setDescription(target.user.tag)
        .setTitle("Mute")
        .addField("Reason", reason)
        .setFooter(moment().format("dddd, MMMM Do YYYY, HH:mm:ss"))

    if (muteTime) logEmbed.addField("Duration", muteTime.timeUnmute.toNow(true));
    log(logEmbed, message.client);

    // sends response message
    return message.channel.send(msg)
        .then(() => { return true })
        .catch((err) => {
            log(`Could not send response message for mute, ${err}`);
            return false;
        });
}

/**
 * Checks message author permission and if a mention/ID is given
 * @param {Discord.Message} message The message received by the bot
 * @param {Array<string>} args The arguments provided to the command and split by processor
 * @returns {Promise<boolean|undefined>}
 */
async function main(message, args) {
    if (getPerm(message.member)) {
        if (message.mentions.everyone) {
            message.channel.send("I can't mute everyone")
                .then(() => { return false });
        } else {
            const target = message.guild.members.resolve(message.mentions.members.first())
            if (target) return await mute(message, args, target);
            const IDtarget = message.guild.members.resolve(args[0]);
            if (IDtarget) return await mute(message, args, IDtarget);
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
    description: desc,
    usage: usage,
    type: type
}
exports.testing = {
    mute: mute,
    parseTime: parseTime,
    getReason: getReason
}