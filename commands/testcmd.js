// command file to test processor

const name = "testcmd";
const description = "Test Description";
const usage = "Test Usage";
const type = "Test Type";
const aliases = ['tc1', 'tc2'];

function main(message, args) {
    return message.content;
}

exports.name = name;
exports.main = main;
exports.data = {
    description: description,
    type: type,
    usage: usage,
    aliases: aliases
}
