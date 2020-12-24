/* command to kick a member
 */
const util = require('../src/util.js');
const { prefix } = require('../config.json');

const name = "kick";
const description = "Kicks a user from the server";
const usage = `${prefix}kick <member mention> [reason]` +
    '\n' + `${prefix}kick <member ID> [reason]`;
const type = "Moderation";

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

async function kick(message, args, target) {
    if (util.getPerm(target, true)) {
        return message.channel.send("Can't kick a staff member")
            .then(() => { return false });
    }

    let reason = getReason(args, target);
    if (reason == "") reason = "No reason given";

    return target.kick({ reason: `${reason} - Kicked by ${message.author.tag}` })
        .then((m) => {
            let msg;
            if (reason == "No reason given")
                msg = `Kicked ${m.user.tag}`;
            else
                msg = `Kicked ${m.user.tag} for ${reason}`;

            return message.channel.send(msg)
                .then(() => {
                    util.log(`${message.author.tag} kicked ${m.user.tag} for ${reason}`, message.client, true);
                    return true;
                });
        })
        .catch(err => {
            return message.channel.send("Unable to kick the member")
                .then(() => {
                    util.log(`Unable to kick member ${target.user.tag} By: ${message.author.tag} Reason: ${reason}, Error: ${err}`, undefined, false, 'error');
                    return false;
                });
        });
}

async function main(message, args) {
    if (util.getPerm(message.member)) {
        if (message.mentions.everyone) {
            return message.channel.send("I can't kick everyone")
                .then(() => { return false });
        } else {
            const target = message.guild.members.resolve(message.mentions.members.first());
            if (target) return await kick(message, args, target);
            const IDtarget = message.guild.members.resolve(args[0]);
            if (IDtarget) return await kick(message, args, IDtarget);
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
    getReason: getReason,
    kick: kick
}