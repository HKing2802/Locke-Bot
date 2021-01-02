const processor = require('../commands/processor.js');
const assert = require('assert');
const Discord = require('discord.js');
const ping = require('../commands/ping.js')
const util = require('../src/util.js')

describe('Get Functions', function () {
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

    it('gets aliases', function () {
        const testcmd = require('../commands/testcmd.js');
        const commands = processor.getFunctions(['testcmd']);
        assert.equal(commands.size, 3);
        assert.equal(commands.get('tc1'), testcmd.main);
        assert.equal(commands.get('tc2'), testcmd.main);
        assert.equal(commands.get('testcmd'), testcmd.main);
    })
})

describe('processor', function () {
    before(() => {
        util.testing.silenceLogging(true);
    });

    after(() => {
        util.testing.silenceLogging(false);
    });

    it('runs command', function (done) {
        // setting up a message to pass to the processor.
        const client = new Discord.Client();
        const guild = new Discord.Guild(client);
        let message = new Discord.Message(client, { content: ".testcmd", id: Discord.SnowflakeUtil.generate() }, guild);

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

    it('checks commands param is type Map', function (done) {
        processor.process({ content: "test" }, "test")
            .then((response) => {
                assert.equal(response, undefined);
                done();
            })
            .catch(err => done(err));
    });
});
