/* Module to handle when a user joins the guild
 */

const { checkNick } = require('./memberUpdate.js');

function main(client) {
    client.on('guildMemberAdd', (member) => {
        checkNick(member, client);
    });
}

exports.main = main;