const { equal } = require('assert');
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

describe('messageProcess', function () {
    const messageProcess = require('../modules/events/messageProcess.js');
    let client;
    let guild;
    let channel;
    let user;

    beforeEach(() => {
        client = new Discord.Client;
        guild = testUtil.createGuild(client);
        channel = new testUtil.testChannel(guild);
        user = testUtil.createUser(client, "test", "1234");
    });

    before(() => {
        silenceLogging(true);
    });

    after(() => {
        silenceLogging(false);
    });

    afterEach(() => {
        client.destroy();
    });

    it('processes message', function (done) {
        channel.send('.ping', user)
            .then((msg) => {
                messageProcess.testing.messageProcess(msg)
                    .then((complete) => {
                        assert(complete);
                        assert.equal(channel.lastMessage.content, 'Pong!');
                        done();
                    })
                    .catch(err => done(err));
            });
    });

    it('checks prefix', function (done) {
        channel.send('ping', user)
            .then((msg) => {
                messageProcess.testing.messageProcess(msg)
                    .then((complete) => {
                        assert.equal(complete, undefined);
                        assert.equal(channel.lastMessage.content, 'ping');
                        done();
                    })
                    .catch(err => done(err));
            });
    });

    it("Doesn't respond on inactive", function (done) {
        const fs = require('fs');
        const config = require('../config.json');

        config.active = false;
        fs.writeFile('./config.json', JSON.stringify(config, null, 2), (err) => {
            if (err) done(err);
            channel.send('.ping', user)
                .then((msg) => {
                    messageProcess.testing.messageProcess(msg)
                        .then((complete) => {
                            assert.equal(complete, undefined);
                            assert.equal(channel.lastMessage.content, '.ping');

                            config.active = true;
                            fs.writeFile('./config.json', JSON.stringify(config, null, 2), (err) => {
                                if (err) done(err);
                                done();
                            });
                        })
                        .catch(err => done(err));
                });
        });
    });

    it('always responds to author', function (done) {
        const fs = require('fs');
        const config = require('../config.json');
        const author = testUtil.createUser(client, 'hking', '9193', false, { id: config.authorID });

        config.active = false;
        fs.writeFile('./config.json', JSON.stringify(config, null, 2), (err) => {
            if (err) done(err);
            channel.send('.ping', author)
                .then((msg) => {
                    messageProcess.testing.messageProcess(msg)
                        .then((complete) => {
                            assert(complete);
                            assert.equal(channel.lastMessage.content, 'Pong!');

                            config.active = true;
                            fs.writeFile('./config.json', JSON.stringify(config, null, 2), (err) => {
                                if (err) done(err);
                                done();
                            });
                        })
                        .catch(err => done(err));
                });
        });
    });

    it('filters attachment', function (done) {
        channel.send('.ping', user, undefined, [], { attachments: [{ id: '12', url: '../config.json', filename: 'file.exe' }] })
            .then((msg) => {
                messageProcess.testing.messageProcess(msg)
                    .then((complete) => {
                        assert.equal(complete, undefined);
                        assert.equal(channel.messages.fetch(msg.id), undefined);
                        assert.equal(channel.lastMessage.content, `Sorry ${user.tag}, I deleted that file because it's file-type is blacklisted in our spam filter`);
                        done();
                    })
                    .catch(err => done(err));
            });
    });
});