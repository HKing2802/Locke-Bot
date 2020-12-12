const logger = require('winston');
const fs = require('fs');

logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

function getFunctions(nameList) {
    let commands = new Map()

    for (let i = 0; i < nameList.length; i++) {
        // iterates over list of filenames and imports their name and main functions
        if (commands.has(nameList[i])) {
            logger.warn("Attempting to import command already in command list. Skipping over...");
            continue;
        }

        // constructs path from filename
        let path = "./" + nameList[i] + ".js";
        let pathcheck = "./commands/" + nameList[i] + ".js";
        let functionImport;

        // checks that the file exists that the file exists
        if (fs.existsSync(pathcheck)) {
            functionImport = require(path);

            // imports name and function
            let name = functionImport.name;
            let func = functionImport.main;

            // adds command to dictionary
            commands.set(name, func);
        } else {
            logger.warn("Attempting to import command with missing file. Skipping over...");
        }
    }
    return commands;
}

function process(message, commands) {
    // verifies that commands parameter is a map
    if (!(commands instanceof Map)) {
        logger.error(`Commands parameter is not Map, instead is ${typeof commands}`);
        return;
    }

    // parses messgae to command and arguments
    const cmdparsed = message.content.substring(1).toLowerCase().split(" ");
    const cmd = cmdparsed[0];
    const args = cmdparsed.splice(1);


    // iterates over commands map to find function of command
    for (let [name, func] of commands) {
        if (name === cmd) {
            return func(message, args);
        }
    }
}

exports.process = process;
exports.getFunctions = getFunctions;