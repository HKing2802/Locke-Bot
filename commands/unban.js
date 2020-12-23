/* Command to uban a member
*/
const util = require('../src/util.js');
const { Message, User } = require('discord.js');

/**
 * Gets the reason for unban from the arguments
 * Strips the mention or ID of the user
 * @param {Array<string>} args The arguments provided to the command and split by processor
 * @param {User} target The target user to unban
 * @returns {string}
 */
function getReason(args, target) {
    const name = `<@!${target.id}>`;
    const id = `${target.id}`;
    let reason = "";

    for (let i = 0; i < args.length; i++) {
        if (args[i].indexOf(name) == -1) {
            if (args[i].indexOf(id) == -1)
                reason += `${args[i]} `;
            else
                reason += `${args[i].substr(id.length)} `;
        } else
            reason += `${args[i].substr(name.length)} `;
    }
    return reason.trim();
}

/**
 * Checks to ensure that the target has been banned before, and performs the unban
 * @param {Message} message The message received by the bot
 * @param {Array<string>} args The arguments provided to the command and split by processor
 * @param {User} target The target user to unban
 * @returns {Promise<boolean>}
 */
async function unban(message, args, target) {
    const banned = message.guild.members.fetchBan(target);
    if (!banned) {
        message.channel.send("This user is not banned");
        return false;
    }

    const reason = getReason(args, target);
    if (reason == "") reason = "No reason given";

    message.guild.members.unban(target, `${reason} - Unbanned by ${message.author.tag}`)
        .then((u) => {
            let msg;
            if (reason == "No reason given")
                msg = `Unbanned ${u.tag}`;
            else
                msg = `Unbanned ${u.tag} for ${reason}`;

            return message.channel.send(msg)
                .then(() => {
                    util.log(`${message.author.tag} unbanned ${u.tag} for ${reason}`, message.client);
                    return true
                });
        })
        .catch(err => {
            return message.channel.send("Unable to unban the user")
                .then(() => {
                    util.log(`Unable to unban user ${$target.tag} By: ${message.author.tag} Reason: ${reason} Error: ${err}`, undefined, false, 'error');
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
            const IDtarget = message.client.users.resolve(args[0]);
            if (IDtarget) return await unban(message, args, IDtarget);
            else {
                return message.channel.send("No user or ID specified")
                    .then(() => { return false });
            }
        }
    }
}