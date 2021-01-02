const assert = require('assert');
const { silenceLogging } = require('../src/util.js').testing;
const Discord = require('discord.js');
const testUtil = require('../discordTestUtility/discordTestUtility.js');

describe('module_handler', function () {
    const handler = require('../src/module_handler.js');
    describe('getModules', function () {
        const goodModule = { name: 'testModule', path: 'test/testModule.js' };
        const badModule = { name: 'testModule2', path: 'testModule.js' };
        const testModule = require('../modules/test/testModule.js');

        before(() => {
            silenceLogging(true);
        });

        after(() => {
            silenceLogging(false);
        });

        it('gets module', function () {
            const modules = handler.getModules([goodModule]);
            assert.equal(modules.size, 1);
            assert(modules.has(goodModule.name));
            assert.equal(modules.get(goodModule.name), testModule.main);
        });

        it('skips bad module', function () {
            const modules = handler.getModules([badModule]);
            assert.equal(modules.size, 0);
            assert(!modules.has(badModule.name));
        });

        it('skips repeated modules', function () {
            const modules = handler.getModules([goodModule, goodModule]);
            assert.equal(modules.size, 1);
            assert(modules.has(goodModule.name));
        });

        it('continues after skipping module', function () {
            const modules = handler.getModules([badModule, goodModule]);
            assert.equal(modules.size, 1);
            assert(modules.has(goodModule.name));
            assert.equal(modules.get(goodModule.name), testModule.main);
        });
    });

    describe('startModules', function () {
        const goodModule = { name: 'testModule', path: 'test/testModule.js' };
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client, undefined);
        let channel;

        before(() => {
            silenceLogging(true);
        });

        beforeEach(() => {
            channel = new testUtil.testChannel(guild);
        });

        after(() => {
            client.destroy();
            silenceLogging(false);
        });

        it('starts modules', function () {
            const modules = handler.getModules([goodModule]);
            const started = handler.startModules(modules, channel);
            assert.equal(started, 1);
            assert.equal(channel.lastMessage.content, "Test Module");
        });

        it('safely handles bad module functions', function () {
            const modules = new Map();
            modules.set('test', 'test');
            const started = handler.startModules(modules, channel);
            assert.equal(started, 0);
            assert.equal(channel.lastMessage, undefined);
        });

        it('checks modules param is type map', function () {
            const started = handler.startModules("test", channel);
            assert.equal(started, -1);
            assert.equal(channel.lastMessage, undefined);
        });
    });
})