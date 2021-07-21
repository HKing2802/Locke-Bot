/* Command to give a member the human role
 */
const { log, getPerm } = require('../src/util.js');
const config = require('../src/config.js');
const { Message, GuildMember } = require('discord.js');

// Command Data
const name = 'verify';
const description = "Verifies a member";
const usage = `${config.getConfig('prefix')}verify <member mention|member ID>`;
const type = 'Moderation';

/**
 * Checks and Verifies Member
 * @param {Message} message The message recieved by the client
 * @param {GuildMember} target The target to verify
 * @returns {boolean}
 */
async function verify(message, target) {
    if (target.roles.cache.has(config.getConfig('humanRoleID'))) {
        message.channel.send('Member already verified');
        return false;
    } else {
        const role = message.guild.roles.cache.get(config.getConfig('humanRoleID'));
        await target.roles.add(role);
        message.channel.send('Member verified');
        log(`Member verified`);
        return true;
    }
}

/**
 * Checks author permission and determins the target
 * Entry point for command
 * @param {Message} message The message recieved by the client
 * @param {Array<string>} args The arguments provided to the command and parsed by the processor
 * @returns {boolean|undefined}
 */
async function main(message, args) {
    if (getPerm(message.member)) {
        if (message.mentions.everyone) {
            return message.channel.send("I can't verify everyone")
                .then(() => { return false });
        } else {
            const target = message.guild.members.resolve(message.mentions.members.first())
            if (target) return await verify(message, target);
            const IDtarget = message.guild.members.resolve(args[0]);
            if (IDtarget) return await verify(message, IDtarget);
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
};
exports.testing = {
    verify: verify
};