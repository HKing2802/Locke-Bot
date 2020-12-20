/* Command to ban a member
 */
const util = require('../util.js');
const config = require('../config.json');
const { GuildMember, Message } = require('discord.js');

// Command information
const name = "ban";
const description = "Bans a member from the server";
const usage = `${config.prefix}ban <member mention> [reason]` +
    `${config.prefix}ban <member ID> [reason]`;
const type = "Moderation";

/**
 * Gets the reason for ban from the arguments
 * Strips the mention of the member being banned
 * @param {Array<string>} args The arguments provided to the command and split by processor
 * @param {GuildMember} target The target of the ban
 * @returns {string}
 */
function getReason(args, target) {
    const name = `<@!${target.id}>`;
    let reason = "";

    for (let i = 0; i < args.length; i++) {
        if (args[i].indexOf(name) == -1)
            reason += `${args[i]} `;
        else
            reason += `${args[i].substr(name.length)} `;
    }
    return reason.trim();
}

/**
 * Checks to ensure that the target can be banned, and performs the ban
 * @param {Message} message The message received by the bot
 * @param {Array<string>} args The arguments provided to the command and split by processor
 * @param {GuildMember} target The target of the ban
 * @returns {boolean}
 */
function ban(message, args, target) {
    if (getPerm(target, true)) {
        chan.send("Can't ban a staff member");
        return false
    }

    let reason = getReason(args, target);

    return target.ban({ reason: `${reason} - Banned by ${message.author.tag}` })
        .then((m) => {
            if (reason == "")
                chan.send(`Banned ${m.user.tag | m.tag | m}, No reason given.`);
            else
                chan.send(`Banned ${m.user.tag | m.tag | m} for ${reason}`)

            util.log(`${message.author.tag} banned ${m.user.tag | m.tag | m} for ${reason}`, message.client, true);
            return true;
        })
        .catch(err => {
            chan.send(`Unable to ban the member`);
            util.log(`Unable to ban member ${target.user.tag}\n By: ${message.author.tag}\n Reason: ${reason}\n Error: ${err}`, undefined, false, 'error');
            return false;
        });
};

/**
 * Checks message author permission and if a mention/ID is given
 * @param {Message} message The message received by the bot
 * @param {Array<string>} args The arguments provided to the command and split by processor
 * @returns {boolean}
 */
function main(message, args) {
    const chan = message.channel;
    if (util.getPerm(message.member)) {
        if (message.mention_everyone) {
            chan.send("I can't Ban everyone");
            return false
        } else {
            let target = message.guild.members.resolve(message.mentions.members.first())
            if (target) return ban(message, args, target);
            target = message.guild.members.resolve(args[0]);
            if (target) return ban(message, args, target);
            else {
                chan.send("No member or ID specified");
                return false;
            }
        }
    }
    return false
}

exports.main = main;
exports.name = name;
exports.description = description;
exports.usage = usage;
exports.type = type;
exports.testing = {
    getReason: getReason,
    ban: ban
}