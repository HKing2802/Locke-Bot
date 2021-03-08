/* Simple command to respond to a ping
 */

const { Message } = require("discord.js");

// name of the command, what would immediately follow the command prefix to run the command
const name = "ping";

/* the description of the command, what would be loaded in the help menu
 * Leave blank or undefined to omit the command from the help function
 */ 
const description = "Pong!";

// the type of the command, which will be the category in the help menu
const type = "Other"

/**
 * The main function of the command, where all code that needs to be run is placed/referenced here 
 * @param {Message} message The discord message object passed to all commands. Client, guild, channel, etc. can be derived from this.
 * @param {Array<string>} args The arguments provided to the command. This is the rest of the message after the commmand seperated by spaces
 * @returns {boolean}
 */
function main(message, args) {
    message.channel.send("Pong!");
    return true;
}

exports.name = name;
exports.description = description;
exports.type = type;
exports.main = main;