const util = require('../util.js');
const config = require('../config.json');
const logger = require('winston');
const fs = require('fs');

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
    const cmdparsed = message.content.substring(1).toLowerCase().split(" ");
    const cmd = cmdparsed[0];
    const args = cmdparsed.splice(1);

    for (let [name, func] of commands) {

    }
}

exports.process = process;
exports.getFunctions = getFunctions;