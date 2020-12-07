const util = require('../util.js');
const config = require('../config.json');
const logger = require('winston');

function getFunctions(nameList) {
    let commands = {}

    for (let i = 0; i < nameList.length; i++) {
        // iterates over list of filenames and imports their name and main functions
        let filename = "./" + nameList[i] + ".js";
        let functionImport = require(filename);
        name = functionImport.name;
        func = functionImport.main;

        // input validation
        if (name in commands) {
            logger.warn("Attempting to import command already in command list. Skipping over...");
        } else {
            commands[name] = main;
        }
    }
}

function process(message) {
    const cmdparsed = message.content.substring(1).toLowerCase().split(" ");
    const cmd = cmdparsed[0];
    const args = cmdparsed.splice(1);

    const chan = message.channel;


}

exports.process = process;