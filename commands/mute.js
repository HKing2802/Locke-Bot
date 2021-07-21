/* Command to mute a member
 */
const config = require('../src/config.js');
const db = require('../src/db.js');
const { getPerm, log, getReason } = require('../src/util.js');
const moment = require('moment');
const Discord = require('discord.js');
const auto_unmute = require('../modules/timed/auto-unmute.js');

const name = 'mute';
const desc = "Mutes a member";
const usage = `${config.get('prefix')}mute <member mention> [duration] [reason]`
    + '\n' + `${config.get('prefix')}mute <member ID> [duration] [reason]`;
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
 * Adds a muted member to the muted users databse
 * @param {Discord.Client} client The bot's client for logging
 * @param {Discord.GuildMember} target The target of the mute
 * @param {boolean} member Boolean if the target has the member role
 * @param {moment} muteTime The date and time of the unmute
 */
async function addToDatabase(client, target, member, muteTime) {
    // checks connection to database
    if (!db.connected()) {
        log(`Not connected to database. Skipping database entry...`, message.client, false, 'warn');
        return;
    }

    // gets muted users table from session
    const table = db.getSessionSchema().getTable('muted_users');

    // converts the member boolean to a tinyint for insertion
    const memberval = member ? 1 : 0;

    // formats unmute time for database
    let timeUnmute = null;
    if (muteTime) timeUnmute = `'${muteTime.timeUnmute.format('YYYY-MM-DD HH:mm:ss')}'`;

    // deletes any entries with the same user id.
    // this prevents insertion errors where the target was unmuted manually before the timer
    // ran out, and before garbage collection removed the unnecessary entry
    table
        .delete()
        .where(`user_id = :id`)
        .bind('id', target.id)
        .limit(1)
        .execute()
        .catch(err => {
            log(`Error in querying database to remove duplicate data: ${err} `, client, false, 'error');
        });

    // inserts the data into the database
    table
        .insert(['user_id', 'name', 'member', 'time_unmute'])
        .values(target.id, target.user.username, memberval, timeUnmute)
        .execute()
        .then(() => {
            log('Logged muted user to Database');
        })
        .catch(err => {
            log(`Error in querying database in mute: ${err}`, client, false, 'error');
        });
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

    if (reason == "" || reason == undefined) reason = "No reason given";
    if (target.roles.cache.has(config.get('memberRoleID'))) member = true;

    // adds role
    const role = message.guild.roles.cache.get(config.get('mutedRoleID'));
    await target.roles.add(role);

    // removes role(s)
    await target.roles.remove(message.guild.roles.cache.get(config.get('humanRoleID')));
    if (member) await target.roles.remove(message.guild.roles.cache.get(config.get('memberRoleID')));

    // constructs DM message
    let DMmsg = `You have been muted in Locke`
    if (reason !== "No reason given") DMmsg += ` for ${reason}`;
    if (muteTime) DMmsg += `\nYou will be unmuted in ${muteTime.timeUnmute.toNow(true)}`;

    // constructs response message
    let msg = `Muted ${target.user.tag}`;
    if (reason == "No reason given") msg += ', No reason given';
    else msg += ` for ${reason}`;

    // adds to database
    addToDatabase(message.client, target, member, muteTime)
        .catch(err => {
            log(`Error in adding to database in mute: ${err}`, message.client, false, 'error');
        });

    // tells auto-unmute to update
    auto_unmute.events.emit('update');

    // logs info
    let logmsg = `${message.author.tag} muted ${target.user.tag} for ${reason}`;
    if (muteTime) logmsg += `Time: ${muteTime.timeUnmute.format()}`;
    log(logmsg);

    // constructs and sends log embed
    const logEmbed = new Discord.MessageEmbed()
        .setAuthor(message.author.tag)
        .setDescription(target.user.tag)
        .setTitle("Mute")
        .addField("Reason", reason)
        .setFooter(moment().format("dddd, MMMM Do YYYY, HH:mm:ss"))

    if (muteTime) logEmbed.addField("Duration", muteTime.timeUnmute.toNow(true));
    log(logEmbed, message.client);

    // sends DM message
    await target.user.createDM()
        .then(async (DMchan) => {
            await DMchan.send(DMmsg);
            target.user.deleteDM();
        })
        .catch(err => { log(`Error in sending DM message: ${err}`, message.client, false, 'error') });

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