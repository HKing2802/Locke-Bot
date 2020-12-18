/* Command to display help message
 */

const config = require('../config.json');
const { log } = require('../util.js');
const fs = require('fs');
const Discord = require('discord.js');
const package = require('../package.json');

const name = "help";
const description = "Displays this message";
const type = "Other";

/**
 * Gets command data from each command file
 * Reads name, description and type
 * @param {Array<string>} nameList Array of file names, as would be in the config
 * @returns {Map<string, string>} Data <function name, function description>
 * @returns {Map<string, Array<string>>} Categories <category, Array<function name>>
 */
function getData(nameList) {
    let data = new Map();
    let categories = new Map();

    for (let i = 0; i < nameList.length; i++) {
        // constructs path from filename
        let path = `./${nameList[i]}.js`;
        let pathcheck = `./commands/${nameList[i]}.js`;

        // checks that the file exists
        if (fs.existsSync(pathcheck)) {
            const functionImport = require(path);
            if (functionImport.description == "" || !(functionImport.description)) continue;
            if (!(functionImport.name) || data.has(functionImport.name)) continue;

            let type;
            if (functionImport.type == "" || !(functionImport.type)) {
                type = "Misc";
            } else {
                type = functionImport.type;
            }

            if (categories.has(type)) {
                const temp = categories.get(type);
                temp.push(functionImport.name);
                categories.set(type, temp);
            } else {
                categories.set(type, [functionImport.name]);
            }

            data.set(functionImport.name, functionImport.description);

        } else {
            log("Attempting to import command data from a missing file. Skipping over...", undefined, false, "warn");
        }
    }

    return { data, categories };
}

/**
 * Sends an embedded message with a list of commands and their descriptions, categorized by type
 * @param {Discord.Message} message The message object of the command
 * @param {Array<string>} args Array of arguments passed to the command
 * @param {Array<string>} [nameListOverride] An override to the config commands list, used for testing
 * @returns {Promise<Discord.Message>} Return used only for testing
 */
function help(message, args, nameListOverride) {
    const embed = new Discord.MessageEmbed()
        .setAuthor("LockeBot")
        .setTitle("Help Menu")
        .setDescription("----------------------------------------")
        .setFooter("v" + package.version + " -- Developed by HKing#9193");

    let nameList;
    nameListOverride ? nameList = nameListOverride : nameList = config.commands;
    const { data, categories } = getData(nameList);
    for (let category of categories.keys()) {
        let value = "";
        for (let name of categories.get(category)) {
            value += `${name}: ${data.get(name)}\n`
        }
        embed.addField(category, value);
    }
    return message.channel.send(embed)
        .then((m) => { return m })
        .catch(err => { log(`Could not send help message: ${err}`, undefined, false, "error") });
}

exports.main = help;
exports.name = name;
exports.testing = {
    getData: getData
};

/*
 *         .addFields(
            { name: 'Ping', value: 'Pong!' },
            { name: 'mute', value: 'Mutes a user, must ba a Mod/Admin' },
            { name: 'unmute', value: 'Unmutes a user, must be a Mod/Admin' },
            { name: 'snipe', value: 'Gets the user\'s deleted messages, must be a Mod/Admin' },
            { name: 'verify', value: 'verifies a user, must be a staff member' },
            { name: 'kick', value: 'Kicks a user from the server, must be a Mod/Admin' },
            { name: 'ban', value: 'Bans a user from the server, must be a Mod/Admin' },
            { name: 'Help', value: 'Displays this Message' })
 */