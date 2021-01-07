const assert = require('assert');
const { silenceLogging } = require('../src/util.js').testing;
const Discord = require('discord.js');
const testUtil = require('../discordTestUtility/discordTestUtility.js');
const moment = require('moment');
const db = require('../src/db.js');
const config = require('../config.json');

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

describe('messageDelete', function () {
    const handler = require('../modules/events/messageDelete.js');
    let client = new Discord.Client();
    let guild = testUtil.createGuild(client);
    let channel = new testUtil.testChannel(guild);
    let user = testUtil.createUser(client, 'test', '1234');

    beforeEach(() => {
        client.destroy();
        client = new Discord.Client;
        guild = testUtil.createGuild(client);
        channel = new testUtil.testChannel(guild);
        user = testUtil.createUser(client, "test", "1234");
    });

    before(async function () {
        silenceLogging(true);

        const auth = require('../auth.json');
        const testConfig = {
            host: auth.db_host,
            user: auth.db_user,
            password: auth.db_pass,
            schema: 'lockebot_test_db',
            port: 33060
        }
        await db.connect(testConfig);
    });

    afterEach(() => {
        db.buildQuery(`DELETE FROM messages WHERE content = 'test message' LIMIT 1`).execute();
        db.buildQuery(`DELETE FROM edits WHERE content = 'test edit' LIMIT 1`).execute();
        db.buildQuery(`DELETE FROM edits WHERE content = 'test edit 2' LIMIT 1`).execute();
    })

    after(async function () {
        await db.disconnect();
        client.destroy();
        silenceLogging(false);
    });

    it('logs a deleted message', function (done) {
        channel.send('test message', user)
            .then((msg) => {
                handler.testing.recordDeleted(msg)
                    .then((complete) => {
                        assert(complete);

                        // check db
                        let numEntries = 0;
                        db.buildQuery(`SELECT * FROM messages WHERE user_id = ${user.id}`)
                            .execute(result => {
                                numEntries += 1;
                                assert.equal(result[0], msg.id);
                                assert.equal(result[1], user.id);
                                assert.equal(moment(result[2]).add('5','h').format(), moment(msg.createdAt).format());
                                assert.equal(result[4], msg.content);
                            })
                            .then(() => {
                                assert.equal(numEntries, 1);
                                done();
                            })
                            .catch(err => done(err));
                    });
            });
    });

    it('logs edits', function (done) {
        const edit1 = testUtil.createMessage(channel, "test edit", user);
        const edit2 = testUtil.createMessage(channel, "test edit 2", user);
        const edits = [edit2, edit1];
        const msg = testUtil.createMessage(channel, "test message", user, { edits: edits });

        handler.testing.recordDeleted(msg)
            .then((complete) => {
                assert(complete);

                // check messages table
                let numEntries = 0;
                db.buildQuery(`SELECT * FROM messages WHERE user_id = ${user.id}`)
                    .execute(result => {
                        numEntries += 1;
                        assert.equal(result[0], msg.id);
                        assert.equal(result[1], user.id);
                        assert.equal(moment(result[2]).add('5', 'h').format(), moment(msg.createdAt).format());
                        assert.equal(result[4], msg.content);
                    })
                    .then(() => {
                        assert.equal(numEntries, 1);

                        // check edits table
                        let numEdits = 0;
                        db.buildQuery(`SELECT * FROM edits WHERE msg_id = ${msg.id}`)
                            .execute(result => {
                                assert.equal(result[0], `${msg.id}${numEdits + 1}`);
                                assert.equal(result[1], msg.id);
                                assert.equal(result[2], numEdits + 1);
                                assert.equal(moment(result[3]).add('5', 'h').format(), moment(edits[numEdits].createdAt).format());
                                assert.equal(result[4], edits[numEdits].content);
                                numEdits += 1
                            })
                            .then(() => {
                                assert.equal(numEdits, 2);
                                done();
                            })
                            .catch(err => done(err));
                    })
                    .catch(err => done(err));
            })
            .catch(err => done(err));
    });

    it('skips on bot author', function (done) {
        const user = testUtil.createUser(client, "test user", "2345", true);
        const msg = testUtil.createMessage(channel, "test", user);

        handler.testing.recordDeleted(msg)
            .then((complete) => {
                assert.equal(complete, false);

                // checks db
                let numEdits = 0;
                db.buildQuery(`SELECT * FROM messages WHERE user_id = ${user.id}`)
                    .execute(result => {
                        numEdits += 1;
                    })
                    .then(() => {
                        assert.equal(numEdits, 0);
                        done();
                    })
                    .catch(err => done(err));
            })
            .catch(err => done(err));
    });
});

describe('memberUpdate', function () {
    const handler = require('../modules/events/memberUpdate.js');
    let client = new Discord.Client();
    let guild = testUtil.createGuild(client);
    let user = testUtil.createUser(client, "test old user", "1234");
    let oldMember = testUtil.createMember(client, guild, user);

    before(() => {
        silenceLogging(true);
    });

    after(() => {
        client.destroy();
        silenceLogging(false);
    });

    it('returns on no change', function (done) {
        const newMember = testUtil.createMember(client, guild, user, [], "test nick");
        oldMember.setNickname("test nick");

        handler.testing.compareNick(oldMember, newMember, client)
            .then((complete) => {
                assert.equal(complete, false);
                assert.equal(newMember.nickname, "test nick");
                assert.equal(oldMember.nickname, "test nick");
                done();
            })
            .catch(err => done(err));
    });

    it('returns on change to no nickname', function (done) {
        const newMember = testUtil.createMember(client, guild, user);
        oldMember.setNickname('g?');

        handler.testing.compareNick(oldMember, newMember, client)
            .then((complete) => {
                assert.equal(complete, false);
                assert.equal(oldMember.nickname, 'g?');
                assert.equal(newMember.nickname, null);
                done();
            })
            .catch(err => done(err));
    });

    it('changes nickname', function (done) {
        const newMember = testUtil.createMember(client, guild, user, [], 'gaÈ');

        handler.testing.compareNick(oldMember, newMember, client)
            .then((complete) => {
                assert.equal(complete, true);
                assert.equal(newMember.nickname, "ga");
                done();
            })
            .catch(err => done(err));
    });

    it('only changes when necessary', function (done) {
        const newMember = testUtil.createMember(client, guild, user, [], "good nickname");

        handler.testing.compareNick(oldMember, newMember, client)
            .then((complete) => {
                assert.equal(complete, undefined);
                assert.equal(newMember.nickname, "good nickname");
                done();
            })
            .catch(err => done(err));
    });

    it('uses default nickname when empty', function (done) {
        const newMember = testUtil.createMember(client, guild, user, [], 'ÈÈÈ');

        handler.testing.compareNick(oldMember, newMember, client)
            .then((complete) => {
                assert.equal(complete, true);
                assert.equal(newMember.nickname, config.defaultNickname);
                done();
            })
            .catch(err => done(err));
    });
});