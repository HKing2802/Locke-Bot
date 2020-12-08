const processor = require('../commands/processor.js');
const assert = require('assert');
const Discord = require('discord.js');
const ping = require('../commands/ping.js')

function captureStream(stream) {
    var oldWrite = stream.write;
    var buf = '';
    stream.write = function (chunk, encoding, callback) {
        buf += chunk.toString();
        oldWrite.apply(stream, arguments);
    }

    return {
        unhook: function unhook() {
            stream.write = oldWrite;
        },
        captured: function () {
            return buf;
        }
    };
}

describe('Get Functions', function () {
    it('gets functions', function () {
        let commands = processor.getFunctions(["ping"])
        assert.equal(commands.size, 1);
        assert.equal(commands.get('ping'), ping.main);
    });

    it('passes bad function names', function () {
        let commands = processor.getFunctions(["ping", "ping"]);
        assert.equal(commands.size, 1);
        assert.equal(commands.get('ping'), ping.main);
    });

    it('passes bad function files', function () {
        let commands = processor.getFunctions(["ping", "test"]);
        assert.equal(commands.size, 1);
        assert.equal(commands.get('ping'), ping.main);
    });
})

describe('processor', function () {
    it('runs command', function () {
        // setting up a message to pass to the processor.
        const client = new Discord.Client()
        const guild = new Discord.Guild(client)
        let message = new Discord.Message(client, { content: ".testcmd" }, guild)

        // destroys client for smooth test exit
        client.destroy();

        let commands = processor.getFunctions(["testcmd"]);
        let response = processor.process(message, commands);

        assert.equal(response, ".testcmd");
    });
})
