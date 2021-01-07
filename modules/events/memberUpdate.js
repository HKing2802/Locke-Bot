/* Module to handle guild member updates
 */
const config = require('../../config.json');
const { log } = require('../../src/util.js');
const re = /[^\x00-\x7F]/g;

async function checkNick(oldMember, newMember, client) {
    if (oldMember.nickname === newMember.nickname || newMember.nickname === null) return false;
    if (config.nicknamePass.includes(newMember.id)) return false;

    const newNick = newMember.nickname.replace(re, '');
    if (newNick != newMember.nickname) {
        newMember.setNickname(newNick);
        log(`Force changed a member's nickname to ${newNick}`, client);
        return true;
    }
}

function main(client) {
    client.on('guildMemberUpdate', (oldMember, newMember) => {
        checkNick(oldMember, newMember, client)
            .catch(err => { log(`Error in nickname check: ${err}`, undefined, false, 'error') });
    });
}

exports.main = main;
exports.testing = {
    checkNick: checkNick
}