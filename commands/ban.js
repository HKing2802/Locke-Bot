/* Command to ban a member
 */
const { getPerm, getReason, log } = require('../src/util.js');
const config = require('../config.json');
const { GuildMember, Message } = require('discord.js');

// Command information
const name = "ban";
const description = "Bans a member from the server";
const usage = `${config.prefix}ban <member mention> [reason]` +
    '\n' + `${config.prefix}ban <member ID> [reason]`;
const type = "Moderation";

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

    let reason = getReason(args, target);

    if (reason == "") reason = "No reason given";

    return target.ban({ reason: `${reason} - Banned by ${message.author.tag}` })
        .then((m) => {
            let msg;
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

            if (reason == "No reason given")
                msg = `Banned ${tag}, No reason given.`;
            else
                msg = `Banned ${tag} for ${reason}`;

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
    ban: ban
}