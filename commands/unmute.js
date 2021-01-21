/* Command to unmute a member
 */
require('hjson/lib/require-config');
const config = require('../config.hjson');
const { getPerm, log, getReason } = require('../src/util.js');
const Discord = require('discord.js');
const db = require('../src/db.js');
const moment = require('moment');
const auto_unmute = require('../modules/timed/auto-unmute.js');

const name = "unmute";
const desc = "Unmutes a member";
const usage = `${config.prefix}unmute <member mention> [reason]`
    + '\n' + `${config.prefix}unmute <member ID> [reason]`;
const type = "Moderation";


async function unmute(message, args, target) {
    // checks target perm
    if (getPerm(target)) {
        return message.channel.send("Can't unmute a staff member")
            .then(() => { return false });
    }

    // checks if member is muted
    if (!target.roles.cache.has(config.mutedRoleID)) {
        return message.channel.send("Member is not muted")
            .then(() => { return false });
    }

    // gets reason
    let reason = getReason(args, target);
    if (reason == "") reason = "No reason given";

    // checks db if member
    let boolMember;
    if (!db.connected()) log(`Not Connected to database. Skipping database check...`, message.client, false, 'warn');
    else {
        // checks if member
        await db.buildQuery(`SELECT member FROM muted_users WHERE user_id = ${target.id}`)
            .execute(result => {
                boolMember = !!result[0];
            })
            .catch(err => { log(`Error in querying database in unmute: ${err}`, message.client, false, 'error') })
        // removes entry
        await db.buildQuery(`DELETE FROM muted_users WHERE user_id = ${target.id} LIMIT 1`).execute()
            .catch(err => { log(`Error in querying databse in unmute delete: ${err}`, message.client, false, 'error') });
    }

    // performs unmute
    target.roles.remove(message.guild.roles.cache.get(config.mutedRoleID));
    target.roles.add(message.guild.roles.cache.get(config.humanRoleID));
    if (boolMember) target.roles.add(message.guild.roles.cache.get(config.memberRoleID));

    // tells auto-unmute to update
    auto_unmute.events.emit('update');

    // logs data
    log(`${message.author.tag} unmuted ${target.user.tag} for ${reason}`);

    // constructs log embed
    const logEmbed = new Discord.MessageEmbed()
        .setAuthor(message.author.tag)
        .setTitle('Unmute')
        .addField('Reason', reason)
        .setFooter(moment().format("dddd, MMMM Do YYYY, HH:mm:ss"));

    log(logEmbed, message.client);

    // constructs and sends response message
    let msg = `Unmuted ${target.user.tag}`;
    if (reason !== "No reason given") msg += ` for ${reason}`;
    return message.channel.send(msg)
        .then(() => { return true })
        .catch((err) => {
            log(`Could not send response message for unmute, ${err}`, message.client, false);
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
    // checks author perm
    if (getPerm(message.member)) {

        // checks for @everyone ping
        if (message.mentions.everyone) {
            return message.channel.send("I can't unmute everyone")
                .then(() => { return false });
        } else {
            // resolves target by mention or ID and calls function
            const target = message.guild.members.resolve(message.mentions.members.first())
            if (target) return await unmute(message, args, target);
            const IDtarget = message.guild.members.resolve(args[0]);
            if (IDtarget) return await unmute(message, args, IDtarget);
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
    unmute: unmute
}