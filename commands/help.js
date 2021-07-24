/* Command to display help message
 */

const config = require('../src/config.js');
const { log } = require('../src/util.js');
const fs = require('fs');
const Discord = require('discord.js');
const package = require('../package.json');

const name = "help";
const description = "Displays this message";
const type = "Misc";

/**
 * Gets the command data from the command file and
 * constructs the message embed
 * @param {string} name The name of the command
 * @returns {Discord.MessageEmbed | string } Constructed message embed or a String response for nonexistent command
 */
function getCommandData(name) {
    const path = `./${name}.js`;
    let pathcheck = `./commands/${name}.js`;

    if (fs.existsSync(pathcheck)) {
        const command = require(path);
        const commandData = command.data;

        if (commandData.description === "" || !(commandData.description)) {
            return "That command does not exist";
        }

        const embed = new Discord.MessageEmbed()
            .setAuthor("LockeBot")
            .setTitle(command.name)
            .setDescription(commandData.description);

        if (!(commandData.type) || commandData.type === "") {
            embed.setFooter(`Misc\nv${package.version} -- Developed by HKing#9193`);
        } else {
            embed.setFooter(`${commandData.type}\nv${package.version} -- Developed by HKing#9193`);
        }

        if (commandData.usage && commandData.usage !== "") {
            embed.addField("Usage", commandData.usage);
        }

        if (commandData.aliases && (commandData.aliases !== "" || commandData.aliases !== [])) {
            let aliasList = "";
            for (let name of commandData.aliases) {
                if (aliasList !== "") {
                    aliasList += `\n${name}`;
                } else {
                    aliasList += name;
                }
            }

            embed.addField("Aliases", aliasList);
        }

        return embed;
    } else {
        return "That command does not exist";
    }
}

/**
 * Filters name list to only the commands that are intended to be shown 
 * in the help menu, which are all commands with a description field
 * and sorts them by category
 * @param {Array<string>} nameList An array of names to be filtered
 * @returns {Map<string, Array<string>>} Map of categorized command names in the format <category, Array<name>>
 * @private
 */
function getCommandList(nameList) {
    const commandList = new Map();

    for (let i = 0; i < nameList.length; i++) {
        // constructs path from filename
        let path = `./${nameList[i]}.js`;
        let pathcheck = `./commands/${nameList[i]}.js`;

        if (fs.existsSync(pathcheck)) {
            const command = require(path);
            const commandData = command.data;

            if (!commandData) { continue; }
            else if (commandData.description === "" || !(commandData.description)) { continue; }
            else if (!(command.name)) { continue; }

            const type = (commandData.type === "" || !(commandData.type)) ? 'Misc' : commandData.type;

            if (commandList.has(type)) {
                const temp = commandList.get(type);
                temp.push(command.name);
                temp.sort();
                commandList.set(type, temp);
            } else {
                commandList.set(type, [command.name]);
            }
        }
    }
    return commandList;
}

/**
 * Sends an embedded message with a list of commands and their descriptions, categorized by type
 * @param {Discord.Message} message The message object of the command
 * @param {Array<string>} args Array of arguments passed to the command
 * @param {Array<string>} [nameListOverride] An override to the config commands list, used for testing
 * @returns {Promise<Discord.Message>} Return used only for testing
 */
function help(message, args, nameListOverride) {
    const nameList = nameListOverride ? nameListOverride : config.getConfig('commands');

    if (args.length === 0) {
        const embed = new Discord.MessageEmbed()
            .setAuthor("LockeBot")
            .setTitle("Help Menu")
            .setDescription("----------------------------------------")
            .setFooter('Use ' + config.getConfig('prefix') + 'help <command> for more information\nv' + package.version + " -- Developed by HKing#9193");

        const commands = getCommandList(nameList);

        for (let type of commands.keys()) {
            let value = "";
            for (let name of commands.get(type)) {
                value += `${name}\n`;
            }
            embed.addField(type, value);
        }

        return message.channel.send(embed)
            .catch(err => { log(`Could not send help message: ${err}`, undefined, false, 'error'); });
    } else {
        let cmdTarget;
        for (let name of nameList) {
            if (name === args[0]) {
                cmdTarget = name;
                break;
            }
        }

        return message.channel.send(getCommandData(cmdTarget))
            .catch(err => { log(`Could not send help message: ${err}`, undefined, false, 'error'); });
    }
}

exports.main = help;
exports.name = name;
exports.data = {
    description: description,
    type: type
}
exports.testing = {
};