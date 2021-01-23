/* Command to uban a member
*/
const util = require('../src/util.js');
const { Message, User } = require('discord.js');
require('hjson/lib/require-config');
const { prefix } = require('../config.hjson');
const auto_unban = require('../modules/timed/auto-unban.js');

const name = "unban";
const description = "Unbans a user from the server";
const usage = `${prefix}unban <user mention> [reason]` +
    '\n' + `${prefix}unban <user ID> [reason]`;
const type = "Moderation";
const aliases = ['ub'];

/**
 * Checks to ensure that the target has been banned before, and performs the unban
 * @param {Message} message The message received by the bot
 * @param {Array<string>} args The arguments provided to the command and split by processor
 * @param {User} target The target user to unban
 * @returns {Promise<boolean>}
 */
async function unban(message, args, target) {
    const banned = await message.guild.fetchBan(target);
    if (!banned) {
        message.channel.send("This user is not banned");
        return false;
    }

    let reason = util.getReason(args, target);
    if (reason == "") reason = "No reason given";

    return message.guild.members.unban(target, `${reason} - Unbanned by ${message.author.tag}`)
        .then((u) => {
            let msg;
            if (reason == "No reason given")
                msg = `Unbanned ${u.tag}`;
            else
                msg = `Unbanned ${u.tag} for ${reason}`;

            // tells auto-unban to update
            auto_unban.events.emit('update');

            return message.channel.send(msg)
                .then(() => {
                    util.log(`${message.author.tag} unbanned ${u.tag} for ${reason}`, message.client);
                    return true
                });
        })
        .catch(err => {
            return message.channel.send("Unable to unban the user")
                .then(() => {
                    util.log(`Unable to unban user ${target.tag} By: ${message.author.tag} Reason: ${reason} Error: ${err}`, undefined, false, 'error');
                    return false;
                })
        })
}

/**
 * Checks message author permission and if a mention/ID is given
 * @param {Message} message The message received by the bot
 * @param {Array<string>} args The arguments provided to the command and split by processor
 * @returns {Promise<boolean|undefined>}
 */
async function main(message, args) {
    if (util.getPerm(message.member)) {
        if (message.mentions.everyone) {
            return message.channel.send("I can't unban everyone")
                .then(() => { return false });
        } else {
            const target = message.client.users.resolve(message.mentions.users.first());
            if (target) return await unban(message, args, target);
            const IDtarget = await message.client.users.fetch(args[0]);
            if (IDtarget) return await unban(message, args, IDtarget);
            else {
                return message.channel.send("No user or ID specified")
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
    type: type,
    aliases: aliases
}
exports.testing = {
    unban: unban
}