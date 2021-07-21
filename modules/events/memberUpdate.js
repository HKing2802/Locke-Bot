/* Module to handle guild member updates
 */
const config = require('../../src/config.js');
const { log } = require('../../src/util.js');
const { Client, GuildMember } = require('discord.js');

/**
 * Checks the nickname/username of a member to fit within nickname rules
 * @param {GuildMember} member The member to check
 * @param {Client} client The client of the bot
 * @param {boolean} logging Wether to log each individual nickname check
 * @returns {boolean}
 */
function checkNick(member, client, logging = true) {
    const re = /[^\x00-\x7F]/g;
    let target;
    if (member.nickname === null) target = member.user.username;
    else target = member.nickname;

    let newNick = target.replace(re, '');
    if (newNick != target) {
        if (newNick == '') newNick = config.get('defaultNickname');
        member.setNickname(newNick);
        if (logging) log(`Force changed a member's nickname to \`${newNick}\``, client);
        return true;
    }
}

async function compareNick(oldMember, newMember, client) {
    if (oldMember.nickname == newMember.nickname) return false;
    else if (config.get('nicknamePass').includes(newMember.id)) return false;
    else return checkNick(newMember, client);
}

function main(client) {
    client.on('guildMemberUpdate', (oldMember, newMember) => {
        compareNick(oldMember, newMember, client)
            .catch(err => { log(`Error in nickname check: ${err}`, undefined, false, 'error') });
    });
}

exports.main = main;
exports.checkNick = checkNick;
exports.testing = {
    compareNick, compareNick
}