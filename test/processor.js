const processor = require('../commands/processor.js');
const assert = require('assert');
const ping = require('../commands/ping.js')

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