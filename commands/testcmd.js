// command file to test processor

const name = "testcmd";
const description = "Test Description";
const type = "Test Type";

function main(message, args) {
    return message.content;
}

exports.name = name;
exports.main = main;
exports.description = description;
exports.type = type;