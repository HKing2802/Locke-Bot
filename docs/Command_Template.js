/* Command Template
 */

const { Message } = require("discord.js");

// name of the command, what would immediately follow the command prefix to run the command
const name = "test";

/* the description of the command, what would be loaded in the help menu
 * Leave blank or undefined to omit the command from the help function
 */
const description = "Template Description";

/*
 * The usages of the command, which would be displayed after the description
 * Leave blank or undefined to omit the command from the help function
 */
const usage = "Template Usage"

// the type of the command, which will be the category in the help menu
const type = "Other"

/*
 * Different names that the command can be run as, set up on startup by the command processor
 * Must take the form of an Array of Strings
 * Leave blank or undefined to not give the command any aliases
 */
const aliases = ["Alias 1", "Alias 2"];

/**
 * The main function of the command, where all code that needs to be run is placed/referenced here 
 * @param {Message} message The discord message object passed to all commands. Client, guild, channel, etc. can be derived from this.
 * @param {Array<string>} args The arguments provided to the command. This is the rest of the message after the commmand seperated by spaces
 * @returns {boolean} Return value is not necessary, however is useful for testing
 */
function main(message, args) {
    message.channel.send("Pong!");
    return true;
}

/*
 * Required Exports:
 * Name - The name of the command
 * Main - The main function
 * 
 * Optional Exports:
 * Optional Exports are wrapped in the data object
 * data.description - Description of the command for the help menu
 * data.type - The command type in the help menu
 * data.usage - Usage to follow the description in the help menu
 * data.aliases - The aliases for the command grabbed by the command processor
 * 
 * Testing:
 * Internal Functions can be exported for testing by wrapping them in the testing object
 * This is purely a style preference shared by other command files
 */
exports.name = name;
exports.main = main;
exports.data = {
    description: description,
    type: type,
    usage: usage,
    aliases: aliases
}
exports.testing = {

}