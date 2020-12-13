const assert = require('assert');
const Discord = require('discord.js');
const classOverrides = require('../discordTestUtility/testclassOverrides.js');
const testUtil = require('../discordTestUtility/discordTestUtility.js');

describe('TestChannel', function () {
    it('sends messages', function () {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client);
        const channel = new classOverrides.TestChannel(guild);

        const id = channel.send("test");
        const message = channel.getMessage(id);

        assert.equal(message.content, "test");
        assert.equal(message.id, id);
        client.destroy();
    });

    it('sends multiple messages', function () {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client);
        const channel = new classOverrides.TestChannel(guild);
        channel.send("test 1", undefined);
        const id2 = channel.send("test 2", undefined);
        const id3 = channel.send("test 3", undefined);

        const message = channel.getMessage(id2);

        assert.equal(message.content, "test 2");
        assert.equal(channel.lastMessageID, id3);
        client.destroy();
    });

    it('adds extra data', function () {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client);
        const channel = new classOverrides.TestChannel(guild);

        const id = channel.send("Test", undefined, undefined, [], { tts: "123" });
        const message = channel.getMessage(id);

        assert.equal(message.content, "Test");
        assert.equal(message.tts, "123");
        client.destroy();
    });

    it('has mentions', function () {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client);
        const channel = new classOverrides.TestChannel(guild);

        const id = channel.send("test message", undefined, undefined, ["test mention"]);
        const message = channel.getMessage(id);

        assert.equal(message.mentions.users.first(), "test mention");
        client.destroy();
    });

    it('has ordered mentions', function () {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client);
        const channel = new classOverrides.TestChannel(guild);

        const id = channel.send("test message", undefined, undefined, ["test mention 1", "test mention 2"]);
        const message = channel.getMessage(id);

        assert.equal(message.mentions.users.first(), "test mention 1");
        assert.equal(message.mentions.users.last(), "test mention 2");
        client.destroy();
    });

    it('pings everyone', function () {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client);
        const channel = new classOverrides.TestChannel(guild);

        const id = channel.send("test message", undefined, undefined, [], {}, true);
        const message = channel.getMessage(id);

        assert.equal(message.mentions.everyone, true);
        client.destroy();
    });

    it('has user author', function () {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client);
        const channel = new classOverrides.TestChannel(guild);
        const user = testUtil.createUser(client, "test username", "1234");

        const id = channel.send("test message", user, undefined);

        assert.equal(channel.getMessage(id).author.username, "test username");
        assert.equal(channel.getMessage(id).author.discriminator, "1234");
        client.destroy();
    });

    it('has member author', function () {
        const client = new Discord.Client();
        const guild = testUtil.createGuild(client);
        const channel = new classOverrides.TestChannel(guild);
        const user = testUtil.createUser(client, "test username", "1234");
        const member = testUtil.createMember(client, guild, user);

        const id = channel.send("test message", user, member);

        assert.equal(channel.getMessage(id).member.user.username, "test username");
        assert.equal(channel.getMessage(id).member.user.discriminator, "1234");
        client.destroy();
    })
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
        assert.equal(user.id, "1234");
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

        assert.equal(id, "1234");
        assert.equal(role.id, "1234");
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
        assert.equal(member.nickname, undefined);
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
                if (err instanceof Error && err.message == "BAN_RESOLVE_ID") {
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
                assert.equal(m.user.username, user.username);
                assert.equal(m.user.discriminator, user.discriminator);
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
            })
    })

    it('ban throws error on wrong test guild setup', function (done) {
        const client = new Discord.Client();
        const guild = new Discord.Guild(client);
        const user = testUtil.createUser(client, "test", "1234");
        const member = testUtil.createMember(client, guild, user);

        member.ban()
            .then((m) => {
                client.destroy();
                done(`ban returned non-error value ${m}`);
            })
            .catch((err) => {
                client.destroy();
                if (err instanceof Error && err.message == "BAD_GUILD_SETUP") {
                    done();
                } else {
                    done(err);
                }
            })
    })
})