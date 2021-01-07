/* Module to handle guild member updates
 */
const config = require('../../config.json');
const { log } = require('../../src/util.js');
const re = /[^\x00-\x7F]/g;

function checkNick(member, client) {
    const newNick = member.nickname.replace(re, '');
    if (newNick != member.nickname) {
        member.setNickname(newNick);
        log(`Force changed a member's nickname to ${newNick}`, client);
        return true;
    }
}

async function compareNick(oldMember, newMember, client) {
    if (oldMember.nickname === newMember.nickname || newMember.nickname === null) return false;
    if (config.nicknamePass.includes(newMember.id)) return false;

    return checkNick(newMember, client);
}

function main(client) {
    client.on('guildMemberUpdate', (oldMember, newMember) => {
        checkNick(oldMember, newMember, client)
            .catch(err => { log(`Error in nickname check: ${err}`, undefined, false, 'error') });
    });
}

exports.main = main;
exports.checkNick = checkNick;
exports.testing = {
    compareNick, compareNick
}