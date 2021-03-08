// Module Template

const { Client } = require("discord.js");

/**
 * The start (or main) function is called at startup, and should initialize
 * any aspect of the module that needs to be ran.
 * 
 * For timed modules, this is usually the initial call then setting up a timer for future calls
 * For event-based modules, this is usually setting up the event handler on the client
 * 
 * @param {Client} client The bot client, passed to every start module
 */
function start(client) {
    // startup code
}

/**
 * The stop function is called at shutdown, and should stop or
 * clean up any aspect of module that needs it
 * 
 * This function can be safely omitted if not necessary, and 
 * will only be called if present and exported
 * 
 * No parameters are passed to the stop function
 */
function stop() {
    if (channel instanceof Discord.Channel) {
        channel.send("Test Module")
            .then((msg) => { return msg });
    } else {
        return channel;
    }
}

/*
 * Exports:
 * start - The startup function for the module
 * main - alternative export name for the startup function
 * stop - The shutdown function for the module, can be omitted
 * 
 * Testing:
 * Internal Functions can be exported for testing by wrapping them in the testing object
 * This is purely a style preference shared by other module files
 */
exports.start = start;
exports.stop = stop;
exports.testing = {

}