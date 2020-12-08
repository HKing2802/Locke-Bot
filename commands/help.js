
const name = "help";

function help(chan) {
    const embed = new Discord.MessageEmbed()
        .setAuthor("LockeBot")
        .setTitle("Help Menu")
        .setDescription("Some Helpful Commands")
        .addFields(
            { name: 'Ping', value: 'Pong!' },
            { name: 'mute', value: 'Mutes a user, must ba a Mod/Admin' },
            { name: 'unmute', value: 'Unmutes a user, must be a Mod/Admin' },
            { name: 'snipe', value: 'Gets the user\'s deleted messages, must be a Mod/Admin' },
            { name: 'verify', value: 'verifies a user, must be a staff member' },
            { name: 'kick', value: 'Kicks a user from the server, must be a Mod/Admin' },
            { name: 'ban', value: 'Bans a user from the server, must be a Mod/Admin' },
            { name: 'Help', value: 'Displays this Message' })
        .setFooter("v" + package.version + " -- Developed by HKing#9193");

    chan.send(embed);
}

exports.main = help;
exports.name = name;