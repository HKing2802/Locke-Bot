const assert = require('assert').strict;
const Discord = require('discord.js');
const classOverrides = require('../discordTestUtility/testclassOverrides.js');
const testUtil = require('../discordTestUtility/discordTestUtility.js');
const util = require("../src/util.js");

describe('TestChannel', function () {
    it('sends messages', function (done) {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client);
        const channel = new classOverrides.TestChannel(guild);

        channel.send("test")
            .then((m) => {
                const message = channel.messages.fetch(m.id);
                assert(m instanceof Discord.Message);
                assert.equal(m.content, "test");
                assert.equal(m.content, message.content);
                client.destroy();
                done()
            })
            .catch((err) => {
                client.destroy();
                done(err);
            });
    });

    it('adds extra data', function (done) {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client);
        const channel = new classOverrides.TestChannel(guild);

        channel.send("Test", undefined, undefined, [], { tts: "123" })
            .then((m) => {
                client.destroy();
                assert.equal(m.content, "Test");
                assert.equal(m.tts, "123");
                done()
            })
            .catch((err) => {
                client.destroy();
                done(err);
            });
    });

    it('pings everyone', function (done) {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client);
        const channel = new classOverrides.TestChannel(guild);

        channel.send("test message", undefined, undefined, [], {}, true)
            .then((m) => {
                client.destroy();
                assert.equal(m.mentions.everyone, true);
                done();
            })
            .catch((err) => {
                client.destroy();
                done(err);
            });
    });

    it('has user author', function (done) {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client);
        const channel = new classOverrides.TestChannel(guild);
        const user = testUtil.createUser(client, "test username", "1234");

        channel.send("test message", user, undefined)
            .then((m) => {
                client.destroy();
                assert.equal(m.author.username, "test username");
                assert.equal(m.author.discriminator, "1234");
                done()
            })
            .catch((err) => {
                client.destroy();
                done(err);
            });
    });

    it('has member author', function (done) {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client);
        const channel = new classOverrides.TestChannel(guild);
        const user = testUtil.createUser(client, "test username", "1234");
        const member = testUtil.createMember(client, guild, user);

        channel.send("test message", user, member)
            .then((m) => {
                client.destroy();
                assert.equal(m.member.user.username, "test username");
                assert.equal(m.member.user.discriminator, "1234");
                done();
            })
            .catch((err) => {
                client.destroy();
                done(err);
            });
    });

    it('saves last message id', function (done) {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client);
        const channel = new classOverrides.TestChannel(guild);

        channel.send("test message")
            .then((m) => {
                assert.equal(m.id, channel.lastMessageID);
                assert.equal(m.content, channel.lastMessage.content);
                client.destroy();
                done();
            })
            .catch(err => {
                client.destroy();
                done(err)
            });
    });
});

describe('create user', function () {
    it('creates normal user', function () {
        const client = new Discord.Client();

        const user = testUtil.createUser(client, "test", "1234")

        assert.equal(user.username, "test");
        assert.equal(user.discriminator, "1234");
        assert.equal(user.bot, false);
        client.destroy();
    });

    it('creates bot user', function () {
        const client = new Discord.Client();

        const user = testUtil.createUser(client, "test 2", "1234", true);

        assert.equal(user.username, "test 2");
        assert.equal(user.discriminator, "1234");
        assert.equal(user.bot, true);
        client.destroy();
    });

    it('maps extra data', function () {
        const client = new Discord.Client();

        const user = testUtil.createUser(client, "test", "4321", false, { id: 1234 });

        assert.equal(user.username, "test");
        assert.equal(user.discriminator, "4321");
        assert.equal(user.bot, false);
        assert.equal(user.id, 1234);
        client.destroy();
    });
});

describe('create Role', function () {
    it('generates snowflake id', function () {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client);

        const { id, role } = testUtil.createRole(client, guild);

        assert.equal(role.guild, guild);
        assert.equal(role.id, id);
        client.destroy();
    });

    it('accepts id from extraData', function () {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client);

        const { id, role } = testUtil.createRole(client, guild, { id: 1234 });

        assert.equal(id, 1234);
        assert.equal(role.id, 1234);
        assert.equal(role.guild, guild);
        client.destroy();
    });

    it('maps extra data', function () {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client);

        const { id, role } = testUtil.createRole(client, guild, { name: "test" });

        assert.equal(role.name, "test");
        client.destroy();
    });
});

describe('create Member', function () {
    it('creates member', function () {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client);
        const user = testUtil.createUser(client, "test username", "1234");

        const member = testUtil.createMember(client, guild, user);
        assert.equal(member.user.username, user.username);
        assert.equal(member.user.discriminator, user.discriminator);
        assert.equal(member.nickname, null);
        assert.equal(member.guild, guild);
        client.destroy();
    });

    it('creates member with a nickname', function () {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client);
        const user = testUtil.createUser(client, "test username", "1234");

        const member = testUtil.createMember(client, guild, user, [], "test");
        assert.equal(member.user.username, "test username");
        assert.equal(member.nickname, "test");
        client.destroy();
    });

    it('creates member with roles', function () {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client);
        const user = testUtil.createUser(client, "test username", "1234");
        const role1 = testUtil.createRole(client, guild, { id: "1", name: "test1" });
        const role2 = testUtil.createRole(client, guild, { id: "2", name: "test2" });

        const member = testUtil.createMember(client, guild, user, [role1.id, role2.id]);
        assert.equal(member.roles.cache.get(role1.id).id, role1.role.id);
        assert.equal(member.roles.cache.get(role1.id).name, role1.role.name);
        assert.equal(member.roles.cache.get(role2.id).id, role2.role.id);
        assert.equal(member.roles.cache.get(role2.id).name, role2.role.name);
        client.destroy();
    });
});

describe('create Guild', function () {
    it('creates guild', function () {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client);

        assert(typeof guild !== 'undefined');
        client.destroy();
    });

    it('creates guild with given id', function () {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client, "12");

        assert(typeof guild !== 'undefined');
        assert.equal(guild.id, "12");
        client.destroy();
    });

    it('creates guild with everyone role', function () {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client, "12");

        assert.equal(guild.roles.cache.get("12").name, "everyone");
        client.destroy();
    });

    it('passes extra data', function () {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client, undefined, { name: "test" });

        assert.equal(guild.name, "test");
        client.destroy();
    })
});

describe('Test Guild', function () {
    it('constructs', function () {
        const client = new Discord.Client();
        const guild = new classOverrides.TestGuild(client);

        client.destroy();
        assert(guild.members.bans instanceof Map);
    });

    it('gets members', function () {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client);
        const user = testUtil.createUser(client, "test", "0001");
        const member = testUtil.createMember(client, guild, user);

        assert.equal(guild.members.fetch(user.id).id, user.id);
        client.destroy()
    });

    it('fetchBan gets ban by user', function () {
        const client = new Discord.Client();
        const guild = new classOverrides.TestGuild(client);
        const user = testUtil.createUser(client, "test", "1234");
        guild.members.bans.set(user.id, { reason: "Test Reason", days: 2 });

        const data = guild.fetchBan(user);
        client.destroy();

        assert(data != undefined);
        assert.equal(data.reason, "Test Reason");
        assert.equal(data.days, 2);
    });

    it('fetchBan gets ban by ID', function () {
        const client = new Discord.Client();
        const guild = new classOverrides.TestGuild(client);
        const user = testUtil.createUser(client, "test", "1234");
        guild.members.bans.set(user.id, { reason: "Test Reason 2", days: 5 });

        const data = guild.fetchBan(user.id);
        client.destroy();

        assert(data != undefined);
        assert.equal(data.reason, "Test Reason 2");
        assert.equal(data.days, 5);
    });

    it('fetchBan returns undefined if not banned', function () {
        const client = new Discord.Client();
        const guild = new classOverrides.TestGuild(client);
        const user = testUtil.createUser(client, "test", "1234");

        const data = guild.fetchBan(user.id);
        client.destroy();

        assert.equal(data, undefined);
    });

    it('fetches all members', function (done) {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client);
        const user = testUtil.createUser(client, "test", "1234");
        const user2 = testUtil.createUser(client, "test2", "1234");
        const user3 = testUtil.createUser(client, "test3", "1234");
        const member = testUtil.createMember(client, guild, user);
        const member2 = testUtil.createMember(client, guild, user2);
        const member3 = testUtil.createMember(client, guild, user3);

        guild.members.fetch()
            .then((members) => {
                client.destroy();
                assert.equal(members.size, 3);
                done();
            })
            .catch(err => done(err));
    });
});

describe('Test Guild Ban', function () {
    it('bans by member object', function (done) {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client);
        const user = testUtil.createUser(client, "test", "0001");
        const member = testUtil.createMember(client, guild, user);

        guild.members.ban(member)
            .then((m) => {
                assert(m instanceof Discord.GuildMember || m instanceof Discord.User || typeof m == 'string');
                assert(guild.members.bans.get(member.id));
                client.destroy();
                done()
            })
            .catch(err => done(err));
    });

    it('bans by user object', function (done) {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client);
        const user = testUtil.createUser(client, "test", "0001");
        const member = testUtil.createMember(client, guild, user);

        guild.members.ban(user)
            .then((m) => {
                assert(m instanceof Discord.GuildMember || m instanceof Discord.User || typeof m == 'string');
                assert(guild.members.bans.get(user.id));
                client.destroy();
                done()
            })
            .catch(err => done(err));
    });

    it('bans by id', function (done) {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client);
        const user = testUtil.createUser(client, "test", "0001");
        const member = testUtil.createMember(client, guild, user);

        guild.members.ban(member.id)
            .then((m) => {
                assert(m instanceof Discord.GuildMember || m instanceof Discord.User || typeof m == 'string');
                assert(guild.members.bans.get(member.id));
                client.destroy();
                done()
            })
            .catch(err => done(err));
    });

    it('throws error for bad parameter', function (done) {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client);
        guild.members.ban("")
            .then((m) => done(`ban returned with non-error value ${m}`))
            .catch((err) => {
                if (err instanceof Error && err.message == "BAN_RESOLVE_ID") {
                    client.destroy();
                    done();
                } else {
                    done(err);
                }
            });
    });
});

describe('Test Guild Unban', function () {
    it('unbans by member object', function (done) {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client);
        const user = testUtil.createUser(client, "test", "0001");
        const member = testUtil.createMember(client, guild, user);

        guild.members.ban(member)
            .then(() => {
                assert(guild.members.bans.get(member.id));
                guild.members.unban(member)
                    .then((m) => {
                        assert(m instanceof Discord.User);
                        assert.equal(guild.members.bans.get(member.id), undefined);
                        client.destroy();
                        done();
                    })
                    .catch(err => done(err));
            })
            .catch(err => done(err));
    });

    it('unbans by user object', function (done) {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client);
        const user = testUtil.createUser(client, "test", "0001");
        const member = testUtil.createMember(client, guild, user);

        guild.members.ban(member)
            .then(() => {
                assert(guild.members.bans.get(member.id));
                guild.members.unban(user)
                    .then((m) => {
                        assert(m instanceof Discord.User);
                        assert.equal(guild.members.bans.get(user.id), undefined);
                        client.destroy();
                        done();
                    })
                    .catch(err => done(err));
            })
            .catch(err => done(err));
    });

    it('unbans by id', function (done) {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client);
        const user = testUtil.createUser(client, "test", "0001");
        const member = testUtil.createMember(client, guild, user);

        guild.members.ban(member.id)
            .then(() => {
                assert(guild.members.bans.get(member.id));
                guild.members.unban(member.id)
                    .then((m) => {
                        assert(m instanceof Discord.User);
                        assert.equal(guild.members.bans.get(member.id), undefined);
                        client.destroy();
                        done();
                    })
                    .catch(err => done(err));
            })
            .catch(err => done(err));
    });

    it('throws error for bad parameter', function (done) {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client);
        guild.members.unban("")
            .then((m) => done(`unban returned with non-error value${m}`))
            .catch((err) => {
                if (err instanceof Error && err.message == "UNBAN_RESOLVE_ID") {
                    client.destroy();
                    done()
                } else {
                    done(err);
                }
            })
    })
});

describe('Test Member', function () {
    it('kicks', function (done) {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client);
        const user = testUtil.createUser(client, "test user", "1234");
        const member = testUtil.createMember(client, guild, user)

        assert(guild.members.fetch(member.id));
        member.kick()
            .then((m) => {
                assert.equal(m.id, member.id);
                assert.equal(m.user.username, user.username);
                assert.equal(m.user.discriminator, user.discriminator);
                assert.equal(guild.members.fetch(member.id), undefined);
                client.destroy()
                done()
            })
            .catch(err => done(err));
    });

    it('bans', function (done) {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client);
        const user = testUtil.createUser(client, "test user", "1234");
        const member = testUtil.createMember(client, guild, user)

        member.ban()
            .then((m) => {
                assert.equal(m.id, member.id);
                assert.equal(m.username, user.username);
                assert.equal(m.discriminator, user.discriminator);
                assert.equal(guild.members.fetch(member.id), undefined);
                assert(guild.members.bans.get(member.id));
                client.destroy()
                done()
            })
            .catch(err => done(err));
    });

    it('kick throws error on no id', function (done) {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client);
        const user = new Discord.User(client, { username: "test", discriminator: "1234", bot: false });
        const member = new classOverrides.TestMember(client, { user: user }, guild);
        guild.members.add(member);

        member.kick()
            .then((m) => {
                client.destroy();
                done(`kick returned non-error value ${m}`);
            })
            .catch((err) => {
                client.destroy();
                if (err instanceof Error && err.message == "NO_ID") {
                    done();
                } else {
                    done(err);
                }
            });
    });

    it('sets nickname', function (done) {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client);
        const user = testUtil.createUser(client, "test", "1234");
        const member = testUtil.createMember(client, guild, user);

        assert.equal(member.nickname, null);
        member.setNickname("test nickname")
        client.destroy();
        assert.equal(member.nickname, "test nickname");
        done();
    });
});

describe('Test Message', function () {
    const client = new Discord.Client();
    let guild;
    let channel;

    beforeEach(() => {
        guild = testUtil.createGuild(client);
        channel = new classOverrides.TestChannel(guild);
    });

    after(() => {
        client.destroy();
    });

    it('has user mentions', function () {
        const user = testUtil.createUser(client, "test user", "1234");
        const msg = new classOverrides.TestMessage(client, { content: "test", mentions: [user], id: Discord.SnowflakeUtil.generate() }, channel)

        assert.equal(msg.mentions.users.first().username, user.username);
        assert.equal(msg.mentions.members.first(), undefined);
    });

    it('has member mentions', function () {
        const user = testUtil.createUser(client, "test member", "1234");
        const member = testUtil.createMember(client, guild, user);
        const msg = new classOverrides.TestMessage(client, { content: "test", mentions: [member], id: Discord.SnowflakeUtil.generate() }, channel);

        assert.equal(msg.mentions.users.first().username, user.username);
        assert.equal(msg.mentions.members.first().user.username, member.user.username)
    });

    it('has edits', function () {
        const id = Discord.SnowflakeUtil.generate();
        const edit1 = new classOverrides.TestMessage(client, { content: 'test', id: id }, channel);
        const edit2 = new classOverrides.TestMessage(client, { content: 'test1', id: id, edits: [edit1] }, channel);
        const msg = new classOverrides.TestMessage(client, { content: "test2", id: id, edits: [edit2, edit1] }, channel);

        assert(Array.isArray(msg.edits));
        assert.equal(msg.edits.length, 3);
        assert.equal(msg.edits[0].content, 'test2');
        assert.equal(msg.edits[1].content, 'test1');
        assert.equal(msg.edits[2].content, 'test');
    });
});

describe('TestMemberRoleManager', function () {
    let client;
    let guild;
    let role;
    let role2;
    let user;
    let member;

    before(() => {
        util.testing.silenceLogging(true);
    });

    beforeEach(() => {
        client = new Discord.Client();
        guild = testUtil.createGuild(client);
        user = testUtil.createUser(client, "test", "1234");
        member = testUtil.createMember(client, guild, user);
        role = testUtil.createRole(client, guild, { name: "test 1" }).role;
        role2 = testUtil.createRole(client, guild, { name: "test 2" }).role;
    });

    afterEach(() => {
        client.destroy();
    });

    after(() => {
        util.testing.silenceLogging(false);
    });

    describe('add', function () {
        it('adds a single role', function (done) {
            member.roles.add(role)
                .then((m) => {
                    assert(m.roles.cache.has(role.id));
                    assert(member.roles.cache.has(role.id));
                    assert.equal(member.roles.cache.get(role.id).name, "test 1");
                    done();
                })
                .catch(err => done(err));
        });

        it('adds multiple roles', function (done) {
            member.roles.add([role, role2])
                .then((m) => {
                    assert(m.roles.cache.has(role.id));
                    assert(m.roles.cache.has(role2.id));
                    assert(member.roles.cache.has(role.id));
                    assert(member.roles.cache.has(role2.id));
                    assert.equal(member.roles.cache.get(role.id).name, "test 1");
                    assert.equal(member.roles.cache.get(role2.id).name, "test 2");
                    done();
                })
                .catch(err => done(err));
        });
    });

    describe('remove', function () {
        beforeEach(() => {
            member = testUtil.createMember(client, guild, user, [role.id, role2.id]);
        })

        it('removes a single role', function (done) {
            member.roles.remove(role)
                .then((m) => {
                    assert(m.roles.cache.has(role2.id));
                    assert(!m.roles.cache.has(role.id));
                    assert(member.roles.cache.has(role2.id));
                    assert(!member.roles.cache.has(role.id));
                    assert.equal(member.roles.cache.get(role2.id).name, "test 2");
                    done();
                })
                .catch(err => done(err));
        });

        it('removes multiple roles', function (done) {
            member.roles.remove([role, role2])
                .then((m) => {
                    assert(!m.roles.cache.has(role.id));
                    assert(!m.roles.cache.has(role2.id));
                    assert(!member.roles.cache.has(role.id));
                    assert(!member.roles.cache.has(role2.id));
                    done();
                })
                .catch(err => done(err));
        });
    });
});

describe('createMessage', function () {
    let client = new Discord.Client();
    let guild = testUtil.createGuild(client);
    let channel = new testUtil.testChannel(guild);

    beforeEach(() => {
        client.destroy();
        client = new Discord.Client;
        guild = testUtil.createGuild(client);
        channel = new testUtil.testChannel(guild);
    });

    after(() => {
        client.destroy();
    });

    it('creates a message', function () {
        const msg = testUtil.createMessage(channel);
        assert('content' in msg);
        assert('id' in msg);
        assert('mentions' in msg);
        assert('author' in msg);
        assert('member' in msg);
        assert('channel' in msg);
    });

    it('has content', function () {
        const msg = testUtil.createMessage(channel, "test content");
        assert.equal(msg.content, "test content");
    });

    it('generates ID', function () {
        const msg = testUtil.createMessage(channel);
        assert(msg.id !== undefined);
    });

    it('sets an ID', function () {
        const msg = testUtil.createMessage(channel, "test", undefined, { id: "1234" });
        assert.equal(msg.id, "1234");
    });

    it('sets everyone mention', function () {
        const msg = testUtil.createMessage(channel, "test", undefined, { mention_everyone: true });
        assert.equal(msg.mentions.everyone, true);
    });

    it('sets user author', function () {
        const user = testUtil.createUser(client, "test", "1234");
        const msg = testUtil.createMessage(channel, "test", user);

        assert(msg.author !== null);
        assert.equal(msg.author.username, "test");
        assert.equal(msg.author.discriminator, "1234");
    });

    it('sets member author', function () {
        const user = testUtil.createUser(client, "test member", "4321");
        const member = testUtil.createMember(client, guild, user);
        const msg = testUtil.createMessage(channel, "test", member);

        assert(msg.member !== null);
        assert(msg.author !== null);
        assert.equal(msg.member.user.username, "test member");
        assert.equal(msg.member.user.discriminator, "4321");
    });
});