/* Module to iterate through the names in the server and check usernames and nicknames
 */

const { checkNick } = require('../events/memberUpdate.js');
const config = require('../../src/config.js');
const { log } = require('../../src/util.js');
const { Client } = require('discord.js');

/**
 * checks the entire server's usernames and nicknames to fit in the nickname rules
 * Returns the number of members changed
 * @param {Client} client The client of the bot
 * @param {string} serverID The id of the server, defaults to guildID in config
 * @returns {number}
 */
async function serverCheck(client, serverID) {
    let id = config.getConfig('guildID');
    if (serverID) id = serverID;

    const guild = await client.guilds.fetch(id);
    let numChanged = 0;

    // this line will take a while
    const members = await guild.members.fetch();

    // this will take even longer
    for (let member of members.values()) {
        if (config.getConfig('nicknamePass').includes(member.id)) continue;
        else {
            if(checkNick(member, client, false)) numChanged += 1;
        }
    }

    log(`Changed ${numChanged} Nicknames at startup`, client, false);
    return numChanged;
}

exports.main = serverCheck;