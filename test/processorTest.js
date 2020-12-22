const processor = require('../commands/processor.js');
const assert = require('assert');
const Discord = require('discord.js');
const ping = require('../commands/ping.js')

describe('Get Functions', function () {
    const util = require('../src/util.js')
    before(() => {
        util.testing.silenceLogging(true);
    })

    after(() => {
        util.testing.silenceLogging(false);
    })

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
    it('runs command', function (done) {
        // setting up a message to pass to the processor.
        const client = new Discord.Client();
        const guild = new Discord.Guild(client);
        let message = new Discord.Message(client, { content: ".testcmd" }, guild);

        // destroys client for smooth test exit
        client.destroy();

        let commands = processor.getFunctions(["testcmd"]);
        processor.process(message, commands)
            .then((response) => {
                assert.equal(response, ".testcmd");
                done()
            })
            .catch(err => done(err))
    });
});
