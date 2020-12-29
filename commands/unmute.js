/* Command to unmute a member
 */
const config = require('../config.json');
const { getPerm, log, getReason } = require('../src/util.js');
const Discord = require('discord.js');
const db = require('../src/db.js');
const moment = require('moment');

const name = "unmute";
const desc = "Unmutes a member";
const usage = `${config.prefix}unmute <member mention> [reason]`
    + '\n' + `${config.prefix}unmute <member ID> [reason]`;
const type = "Moderation";


async function unmute(message, args, target) {
    // checks target perm
    if (getPerm(target)) {
        message.channel.send("Can't mute a staff member")
            .then(() => { return false });
    }

    // checks if member is muted
    if (!target.roles.cache.has(config.mutedRoleID)) {
        message.channel.send("Member is not muted")
            .then(() => { return false });
    }

    // gets reason
    let reason = getReason(args, target);
    if (reason == "") reason = "No reason given";

    // checks db if member
    // TODO: add check db
    // TEMP
    const boolMember = false;

    // performs unmute
    target.roles.remove(message.guild.roles.cache.get(config.mutedRoleID));
    target.roles.add(message.guild.roles.cache.get(config.humanRoleID));
    if (boolMember) target.roles.add(message.guild.roles.cache.get(config.memberRoleID));

    // logs data
    log(`${message.author.tag} unmuted ${target.user.tag} for ${reason}`);

    // constructs log embed
    const logEmbed = new Discord.MessageEmbed()
        .setAuthor(message.author.tag)
        .setTitle('Unmute')
        .setField('Reason', reason)
        .setFooter(moment().format("dddd, MMMM Do YYYY, HH:mm:ss"));

    log(logEmbed, message.client);
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
            message.channel.send("I can't mute everyone")
                .then(() => { return false });
        } else {
            // resolves target by mention or ID and calls function
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
    unmute: unmute
}