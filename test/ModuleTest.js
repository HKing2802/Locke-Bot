const assert = require('assert').strict;
const { silenceLogging } = require('../src/util.js').testing;
const Discord = require('discord.js');
const testUtil = require('../discordTestUtility/discordTestUtility.js');
const moment = require('moment');
const db = require('../src/db.js');
require('hjson/lib/require-config');
const config = require('../config.hjson');

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
            assert.equal(channel.lastMessage, null);
        });

        it('checks modules param is type map', function () {
            const started = handler.startModules("test", channel);
            assert.equal(started, -1);
            assert.equal(channel.lastMessage, null);
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
        const persistent = require('../persistent.json');

        persistent.active = false;
        fs.writeFile('./persistent.json', JSON.stringify(persistent, null, 2), (err) => {
            if (err) done(err);
            channel.send('.ping', user)
                .then((msg) => {
                    messageProcess.testing.messageProcess(msg)
                        .then((complete) => {
                            assert.equal(complete, undefined);
                            assert.equal(channel.lastMessage.content, '.ping');

                            persistent.active = true;
                            fs.writeFile('./persistent.json', JSON.stringify(persistent, null, 2), (err) => {
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
        const persistent = require('../persistent.json');
        const author = testUtil.createUser(client, 'hking', '9193', false, { id: config.authorID });

        persistent.active = false;
        fs.writeFile('./persistent.json', JSON.stringify(persistent, null, 2), (err) => {
            if (err) done(err);
            channel.send('.ping', author)
                .then((msg) => {
                    messageProcess.testing.messageProcess(msg)
                        .then((complete) => {
                            assert(complete);
                            assert.equal(channel.lastMessage.content, 'Pong!');

                            persistent.active = true;
                            fs.writeFile('./persistent.json', JSON.stringify(persistent, null, 2), (err) => {
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
                                assert.equal(moment(result[3]).add('5','h').format(), moment(msg.createdAt).format());
                                assert.equal(result[5], msg.content);
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
                        assert.equal(moment(result[3]).add('5', 'h').format(), moment(msg.createdAt).format());
                        assert.equal(result[5], msg.content);
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

describe('garbage collection', function () {
    const gb = require('../modules/timed/dbGarbageCollection.js');

    before(async function () {
        silenceLogging(true);
        await db.connect();
    });

    after(async function () {
        await db.buildQuery(`DELETE FROM messages WHERE user_id = 456`).execute()
            .catch(err => { throw err });
        await db.buildQuery(`DELETE FROM edits WHERE id = 456`).execute()
            .catch(err => { throw err });
        await db.buildQuery(`DELETE FROM muted_users WHERE member = 3`).execute()
            .catch(err => { throw err });
        await db.buildQuery(`DELETE FROM temp_ban WHERE CHAR_LENGTH(user_id) = 3 LIMIT 2`).execute()
            .catch(err => { throw err });
        await db.disconnect();
        silenceLogging(false);
    });

    it('cleans messages', function (done) {
        // loads test data
        // test data is identified by user_id being 456
        const form = 'YYYY-MM-DD HH:mm:ss';
        db.buildQuery(`insert into messages(id, user_id, channel_id, send_time, content)
            values
	        (12, 456, 333, '${moment().format(form)}', 'test message'),
            (13, 456, 333, '${moment().subtract(2, 'd').format(form)}', 'test message 2'),
            (14, 456, 333, '${moment().subtract(10, 'd').format(form)}', 'test message 3'),
            (15, 456, 333, '${moment().subtract(21, 'd').format(form)}', 'test message 4')`).execute()
            .catch(err => done(err));

        gb.testing.messages()
            .then((num) => {
                assert.equal(num, 2);

                // checks db
                let numEntries = 0;
                db.buildQuery(`SELECT id FROM messages WHERE user_id = 456`)
                    .execute(result => {
                        if (result[0] == 14 || result[0] == 15) assert(false, 'Entry not deleted');
                        if (result[0] == 12 || result[0] == 13) numEntries += 1;
                    })
                    .then(() => {
                        assert.equal(numEntries, 2);
                        done();
                    })
                    .catch(err => done(err));
            })
            .catch(err => done(err));
    });

    it('cleans edits', function (done) {
        // loads test data
        // test data is identified by id being 456
        db.buildQuery(`insert into messages(id, user_id, send_time, content)
            values (16, 456, '2021-1-09 2:00:00', 'test edit message')`).execute()
            .catch(err => done(err));
        db.buildQuery(`insert into edits(id, msg_id, num, edit_time, content)
            values
            (456, 16, 1, '2021-1-09 2:00:00', 'test edit 1'),
            (457, 17, 1, '2021-1-09 2:00:00', 'test edit 2')`).execute()
            .catch(err => done(err));

        gb.testing.edits()
            .then((num) => {
                assert.equal(num, 1);

                // checks db
                let numEntries = 0;
                db.buildQuery(`select msg_id from edits where id = 456`)
                    .execute(result => {
                        if (result[0] == 17) assert(false, 'Entry not deleted');
                        numEntries += 1;
                    })
                    .then(() => {
                        assert.equal(numEntries, 1);
                        done();
                    })
                    .catch(err => done(err));
            })
            .catch(err => done(err));
    });

    it('cleans muted users', function (done) {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client, config.guildID);
        const user = testUtil.createUser(client, "test user", "1234");
        const user2 = testUtil.createUser(client, "test user 2", "4321");
        const mutedRole = testUtil.createRole(client, guild, { id: config.mutedRoleID }).role;
        const member = testUtil.createMember(client, guild, user);
        const member2 = testUtil.createMember(client, guild, user2, [mutedRole.id]);

        // load test data
        // test data is identified by member being 3
        db.buildQuery(`insert into muted_users (user_id, name, member) values 
            (${member.id}, '${user.username}', 3),
            (${member2.id}, '${user2.username}', 3),
            (123, 'nonexistent user', 3);`).execute()
            .catch(err => done(err));

        gb.testing.muted(client)
            .then(async (num) => {
                client.destroy();
                assert.equal(num, 2);

                // checks db
                let numEntries = 0;
                await db.buildQuery(`SELECT user_id FROM muted_users WHERE member = 3`)
                    .execute(result => {
                        if (result[0] == member.id || result[0] == 123) assert(false, "Entry not deleted");
                        numEntries += 1;
                    })
                    .catch(err => done(err));
                assert.equal(numEntries, 1);
                done();
            })
            .catch(err => done(err));
    });

    it('cleans banned users', function (done) {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client, config.guildID);
        const user = testUtil.createUser(client, "test user", "1234", false, { id: "456" });
        const member = testUtil.createMember(client, guild, user);

        // load data
        // test data is indentified by user_id being length 3
        db.buildQuery(`insert into temp_ban (user_id) values (${member.id}), (457);`).execute()
            .catch(err => done(err));

        member.ban()
            .then(() => {
                gb.testing.banned(client, guild)
                    .then(async (num) => {
                        client.destroy();
                        assert.equal(num, 1);

                        //checks db
                        let numEntries = 0;
                        await db.buildQuery(`SELECT user_id FROM temp_ban WHERE LENGTH(user_id) = 3`)
                            .execute(result => {
                                if (result[0] == 457) assert(false);
                                numEntries += 1;
                            })
                            .catch(err => done(err));
                        assert.equal(numEntries, 1);
                        done();
                    })
                    .catch(err => done(err));
            })
            .catch(err => done(err));
    });
});

describe('auto-unmute', function (done) {
    const au = require('../modules/timed/auto-unmute.js');
    const sinon = require('sinon');
    let client = new Discord.Client();
    let guild = testUtil.createGuild(client);
    let user = testUtil.createUser(client, "test user", "1234");
    let humanRole = testUtil.createRole(client, guild, { name: "human", id: config.humanRoleID }).role;
    let mutedRole = testUtil.createRole(client, guild, { name: "muted", id: config.mutedRoleID }).role;
    let member = testUtil.createMember(client, guild, user, [mutedRole.id], '', {id: "33"});

    before(async () => {
        silenceLogging(false);
        await db.connect();
    });

    beforeEach(() => {
        client.destroy();
        client = new Discord.Client();
        guild = testUtil.createGuild(client, config.guildID);
        user = testUtil.createUser(client, "test user", "1234");
        humanRole = testUtil.createRole(client, guild, { name: "human", id: config.humanRoleID }).role;
        mutedRole = testUtil.createRole(client, guild, { name: "muted", id: config.mutedRoleID }).role;
        const memberRole = testUtil.createRole(client, guild, { name: "member", id: config.memberRoleID });
        member = testUtil.createMember(client, guild, user, [mutedRole.id], '', { id: "33" });
    });

    after(async () => {
        await db.disconnect();
        silenceLogging(false);
        client.destroy();
    });

    describe('unmute', function () {
        it('unmutes', function (done) {
            au.testing.unmute(client, member.id, false)
                .then((complete) => {
                    const target = guild.members.cache.get(member.id);
                    assert.equal(complete, true);
                    assert(target.roles.cache.has(humanRole.id));
                    assert(!(target.roles.cache.has(mutedRole.id)));
                    assert(!(target.roles.cache.has(config.memberRoleID)));
                    done();
                })
                .catch(err => done(err));
        });

        it('gives member role', function (done) {
            au.testing.unmute(client, member.id, true)
                .then((complete) => {
                    const target = guild.members.cache.get(member.id);
                    assert.equal(complete, true);
                    assert(target.roles.cache.has(humanRole.id));
                    assert(target.roles.cache.has(config.memberRoleID));
                    assert(!(target.roles.cache.has(mutedRole.id)));
                    done();
                })
                .catch(err => done(err));
        });

        it('returns on already unmuted', async function () {
            await guild.members.cache.get(member.id).roles.remove(mutedRole.id);
            await guild.members.cache.get(member.id).roles.add(humanRole.id);

            const complete = await au.testing.unmute(client, member.id, false);
            assert.equal(complete, false);
            const target = guild.members.cache.get(member.id);
            assert(target.roles.cache.has(humanRole.id));
            assert(!(target.roles.cache.has(mutedRole.id)));
        });

        it('returns on no target', function (done) {
            au.testing.unmute(client, '123', false)
                .then((complete) => {
                    assert.equal(complete, false);
                    const target = guild.members.cache.get(member.id);
                    assert(target.roles.cache.has(mutedRole.id));
                    assert(!(target.roles.cache.has(humanRole.id)));
                    assert(!(target.roles.cache.has(config.memberRoleID)));
                    done();
                })
                .catch(err => done(err));
        });
    });

    describe('setupUnmute', function () {
        let clock;
        const formatting = 'YYYY-MM-DD HH:mm:ss';
        async function loadData(id, m, tu) {
            await db.buildQuery(`INSERT INTO muted_users (user_id, member, time_unmute) VALUES (${id}, ${m}, '${tu}')`).execute();
        }

        async function cleanData(id) {
            await db.buildQuery(`DELETE FROM muted_users WHERE user_id = ${id}`).execute();
        }

        beforeEach(() => {
            clock = sinon.useFakeTimers();
        });

        afterEach(async () => {
            clock.restore();
            await db.buildQuery(`DELETE FROM muted_users WHERE LENGTH(user_id) = 2`)
        });

        it('sets up timer', async function () {
            const tu = moment().add(2, 's').format(formatting);
            loadData(member.id, 0, tu).then(() => {
                au.testing.setupUnmute(client, member.id)
                    .then(async (to) => {
                        assert(to instanceof NodeJS.Timeout);
                        assert(guild.members.cache.get(member.id).roles.cache.get(mutedRole.id));
                        assert(!(guild.member.cache.get(member.id).roles.cache.get(humanRole.id)));
                        clock.tick(1999);
                        assert(guild.members.cache.get(member.id).roles.cache.get(mutedRole.id));
                        assert(!(guild.member.cache.get(member.id).roles.cache.get(humanRole.id)));
                        clock.tick(2);
                        assert(guild.members.cache.get(member.id).roles.cache.get(humanRole.id));
                        assert((guild.member.cache.get(member.id).roles.cache.get(mutedRole.id)));
                    })
            })
        });
    });
});