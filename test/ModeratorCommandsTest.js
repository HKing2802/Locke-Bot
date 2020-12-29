const assert = require('assert');
const testUtil = require('../discordTestUtility/discordTestUtility.js');
const Discord = require('Discord.js');
const util = require('../src/util.js');
const config = require('../config.json');

describe('ban', function () {
    const ban = require('../commands/ban.js');
    const client = new Discord.Client();
    let guild;
    let user;
    let member;
    let channel;

    // Quiets the logger for test displays
    before(() => {
        util.testing.silenceLogging(true);
    })

    // Reconstructs the testing environment before every test to ensure there is no inter-test problems
    beforeEach(() => {
        guild = testUtil.createGuild(client);
        user = testUtil.createUser(client, "test", "1234");
        member = testUtil.createMember(client, guild, user);
        channel = new testUtil.testChannel(guild);
    })

    after(() => {
        util.testing.silenceLogging(false)
        client.destroy();
    })

    describe('ban', function () {
        it('bans from the guild', function (done) {
            assert(guild.members.cache.get(member.id) != undefined);
            channel.send(".ban this message", user)
                .then((msg) => {
                    ban.testing.ban(msg, ["this", "message"], member)
                        .then((complete) => {
                            assert(complete);
                            assert.equal(guild.members.cache.get(member.id), undefined);
                            done();
                        })
                        .catch(err => done(err));
                })
                .catch(err => done(err));
        });

        it('has the correct reason', function (done) {
            channel.send(`.ban <@!${member.id}>This ban reason!`, user)
                .then((msg) => {
                    ban.testing.ban(msg, [`<@!${member.id}>This`, "ban", "reason!"], member)
                        .then((complete) => {
                            assert(complete);
                            assert.equal(channel.lastMessage.content, `Banned ${user.tag} for This ban reason!`);
                            done();
                        })
                        .catch(err => done(err));
                });
        });

        it('uses No reason given', function (done) {
            channel.send(`.ban <@!${member.id}>`, user)
                .then((msg) => {
                    ban.testing.ban(msg, [`<@!${member.id}>`], member)
                        .then((complete) => {
                            assert(complete);
                            assert.equal(channel.lastMessage.content, `Banned ${user.tag}, No reason given.`);
                            done();
                        })
                        .catch(err => done(err));
                });
        });

        it('rejects banning a staff member', function (done) {
            const { id, role } = testUtil.createRole(client, guild, { id: config.adminRoleID });
            member = testUtil.createMember(client, guild, user, [id]);
            channel.send(`.ban <@!${member.id}>`, user)
                .then((msg) => {
                    ban.testing.ban(msg, [`<@!${member.id}>`], member)
                        .then((complete) => {
                            assert(!(complete));
                            assert.equal(channel.lastMessage.content, "Can't ban a staff member");
                            done()
                        })
                        .catch(err => done(err));
                });
        });
    });

    describe('main', function () {
        it('checks author perm', function (done) {
            member = testUtil.createMember(client, guild, user, [config.helperRoleID]);
            channel.send(".ban", user, member)
                .then((msg) => {
                    ban.main(msg, [])
                        .then((complete) => {
                            assert.equal(complete, undefined)
                            assert.equal(channel.lastMessage.content, ".ban");
                            assert(guild.members.cache.get(member.id) != undefined);
                            done()
                        })
                        .catch(err => done(err));
                });
        });

        it('checks everyone ping', function (done) {
            const guild = testUtil.createGuild(client);
            const user = testUtil.createUser(client, "test", "1234", false);
            const member = testUtil.createMember(client, guild, user);
            const channel = new testUtil.testChannel(guild);

            const adminrole = testUtil.createRole(client, guild, { id: config.adminRoleID });
            const userAuthor = testUtil.createUser(client, "Test Author", "4321");
            const memberAuthor = testUtil.createMember(client, guild, userAuthor, [adminrole.id]);

            channel.send(".ban", userAuthor, memberAuthor, [], {}, true)
                .then((msg) => {
                    ban.main(msg, [])
                        .then((complete) => {
                            assert(!complete && complete !== undefined);
                            assert.equal(channel.lastMessage.content, "I can't Ban everyone");
                            assert(guild.members.cache.get(member.id) != undefined);
                            done()
                        })
                        .catch(err => done(err));
                });
        });

        it('returns on no mention or ID', function (done) {
            const guild = testUtil.createGuild(client);
            const user = testUtil.createUser(client, "test", "1234", false);
            const member = testUtil.createMember(client, guild, user);
            const channel = new testUtil.testChannel(guild);

            const adminrole = testUtil.createRole(client, guild, { id: config.adminRoleID });
            const userAuthor = testUtil.createUser(client, "Test Author", "4321");
            const memberAuthor = testUtil.createMember(client, guild, userAuthor, [adminrole.id]);

            channel.send(".ban", userAuthor, memberAuthor)
                .then((msg) => {
                    ban.main(msg, [])
                        .then((complete) => {
                            assert(!complete && complete !== undefined);
                            assert.equal(channel.lastMessage.content, "No member or ID specified")
                            assert(guild.members.cache.get(member.id) != undefined);
                            done();
                        })
                        .catch(err => done(err));
                });
        });

        it('bans by mention', function (done) {
            const guild = testUtil.createGuild(client);
            const user = testUtil.createUser(client, "test", "1234", false);
            const member = testUtil.createMember(client, guild, user);
            const channel = new testUtil.testChannel(guild);

            const adminrole = testUtil.createRole(client, guild, { id: config.adminRoleID });
            const userAuthor = testUtil.createUser(client, "Test Author", "4321");
            const memberAuthor = testUtil.createMember(client, guild, userAuthor, [adminrole.id]);

            channel.send(`.ban <@!${member.id}> Reasoning`, userAuthor, memberAuthor, [member])
                .then((msg) => {
                    ban.main(msg, [`<@!${member.id}>`, "Reasoning"])
                        .then((complete) => {
                            assert(complete);
                            assert.equal(channel.lastMessage.content, `Banned ${user.tag} for Reasoning`);
                            assert.equal(guild.members.cache.get(member.id), undefined);
                            done();
                        })
                        .catch(err => done(err));
                })
                .catch(err => done(err));
        });

        it('bans by ID', function (done) {
            const guild = testUtil.createGuild(client);
            const user = testUtil.createUser(client, "test", "1234", false);
            const member = testUtil.createMember(client, guild, user);
            const channel = new testUtil.testChannel(guild);

            const adminrole = testUtil.createRole(client, guild, { id: config.adminRoleID });
            const userAuthor = testUtil.createUser(client, "Test Author", "4321");
            const memberAuthor = testUtil.createMember(client, guild, userAuthor, [adminrole.id]);

            channel.send(`.ban ${member.id} Reasoning 2`, userAuthor, memberAuthor)
                .then((msg) => {
                    ban.main(msg, [`${member.id}`, "Reasoning", "2"])
                        .then((complete) => {
                            assert(complete);
                            assert.equal(channel.lastMessage.content, `Banned ${user.tag} for Reasoning 2`);
                            assert.equal(guild.members.cache.get(member.id), undefined);
                            done();
                        })
                        .catch(err => done(err));
                });
        });
    });
})

describe('unban', function () {
    const unban = require('../commands/unban.js');
    let client;
    let guild;
    let user;
    let authorUser;
    let channel;

    before(() => {
        util.testing.silenceLogging(true);
    })

    after(() => {
        util.testing.silenceLogging(false);
    })

    beforeEach(() => {
        client = new Discord.Client();
        guild = testUtil.createGuild(client);
        user = testUtil.createUser(client, "Test User", "1234");
        authorUser = testUtil.createUser(client, "Test Author User", "4321");
        channel = new testUtil.testChannel(guild);
        guild.members.bans.set(user.id, { reason: "test ban" });
    })

    afterEach(() => {
        client.destroy();
    })

    describe('unban', function () {
        it('unbans from the guild', function (done) {
            channel.send(".unban", authorUser)
                .then((msg) => {
                    unban.testing.unban(msg, ["This", "Reasoning"], user)
                        .then((complete) => {
                            assert(complete)
                            assert.equal(guild.members.bans.get(user.id), undefined);
                            assert.equal(channel.lastMessage.content, `Unbanned ${user.tag} for This Reasoning`);
                            done();
                        })
                        .catch(err => done(err));
                });
        });

        it('uses No reason given', function (done) {
            channel.send(".unban", authorUser)
                .then((msg) => {
                    unban.testing.unban(msg, [], user)
                        .then((complete) => {
                            assert(complete);
                            assert.equal(guild.members.bans.get(user.id), undefined);
                            assert.equal(channel.lastMessage.content, `Unbanned ${user.tag}`);
                            done();
                        })
                        .catch(err => done(err));
                });
        });

        it('checks if user has been banned', function (done) {
            guild.members.bans.delete(user.id);
            channel.send(".unban", authorUser)
                .then((msg) => {
                    unban.testing.unban(msg, [], user)
                        .then((complete) => {
                            assert(!complete);
                            assert.equal(channel.lastMessage.content, "This user is not banned");
                            done();
                        })
                        .catch(err => done(err));
                });
        });
    });

    describe('main', function () {
        let authorMember
        beforeEach(() => {
            const adminRole = testUtil.createRole(client, guild, { id: config.adminRoleID });
            authorMember = testUtil.createMember(client, guild, authorUser, [adminRole.id]);
        })
        it('checks author perm', function (done) {
            const member = testUtil.createMember(client, guild, user);
            channel.send(".unban No one", user, member)
                .then((msg) => {
                    unban.main(msg, ["No", "one"])
                        .then((complete) => {
                            assert.equal(complete, undefined);
                            assert.equal(channel.lastMessage.content, ".unban No one");
                            assert.equal(guild.members.bans.get(user.id).reason, "test ban");
                            done();
                        })
                        .catch(err => done(err));
                });
        });

        it('checks everyone ping', function (done) {

            channel.send(".unban", authorUser, authorMember, [], {}, true)
                .then((msg) => {
                    unban.main(msg, [])
                        .then((complete) => {
                            assert(!complete && complete !== undefined);
                            assert.equal(channel.lastMessage.content, "I can't unban everyone");
                            assert.equal(guild.members.bans.get(user.id).reason, "test ban");
                            done();
                        })
                        .catch(err => done(err));
                });
        });

        it('sends message on no mention or ID', function (done) {
            channel.send(".unban", authorUser, authorMember)
                .then((msg) => {
                    unban.main(msg, [])
                        .then((complete) => {
                            assert(!complete && complete !== undefined);
                            assert.equal(channel.lastMessage.content, "No user or ID specified");
                            assert.equal(guild.members.bans.get(user.id).reason, "test ban");
                            done();
                        })
                        .catch(err => done(err));
                });
        });

        it('unbans by mention', function (done) {
            channel.send(".unban", authorUser, authorMember, [user])
                .then((msg) => {
                    unban.main(msg, [`<@!${user.id}>`, "Reasoning"])
                        .then((complete) => {
                            assert(complete);
                            assert.equal(channel.lastMessage.content, `Unbanned ${user.tag} for Reasoning`);
                            assert.equal(guild.members.bans.get(user.id), undefined);
                            done();
                        })
                        .catch(err => done(err));
                });
        });

        it('unbans by ID', function (done) {
            channel.send(`.unban ${user.id} Reasoning`, authorUser, authorMember)
                .then((msg) => {
                    unban.main(msg, [`${user.id}`, "Reasoning"])
                        .then((complete) => {
                            assert(complete);
                            assert.equal(channel.lastMessage.content, `Unbanned ${user.tag} for Reasoning`);
                            assert.equal(guild.members.bans.get(user.id), undefined);
                            done();
                        })
                        .catch(err => done(err));
                });
        });
    });
});

describe('kick', function () {
    const kick = require('../commands/kick.js');
    let client;
    let guild;
    let user;
    let member;
    let channel;
    let authorUser;

    beforeEach(() => {
        client = new Discord.Client();
        guild = testUtil.createGuild(client);
        user = testUtil.createUser(client, "Test", "1234");
        member = testUtil.createMember(client, guild, user);
        channel = new testUtil.testChannel(guild);
        authorUser = testUtil.createUser(client, "Test Author", "4321");
    });

    before(() => {
        util.testing.silenceLogging(true);
    });

    after(() => {
        util.testing.silenceLogging(false);
    });

    afterEach(() => {
        client.destroy();
    });

    describe('kick', function () {
        it('kicks the member', function (done) {
            channel.send(".kick", authorUser)
                .then((msg) => {
                    kick.testing.kick(msg, ['Reasoning'], member)
                        .then((complete) => {
                            assert(complete);
                            assert.equal(channel.lastMessage.content, `Kicked ${user.tag} for Reasoning`);
                            assert(!guild.members.cache.has(user.id));
                            done();
                        })
                        .catch(err => done(err));
                });
        });

        it('checks if target is staff', function (done) {
            const helperRole = testUtil.createRole(client, guild, { id: config.helperRoleID });
            member = testUtil.createMember(client, guild, user, [helperRole.id]);
            channel.send(".kick", authorUser)
                .then((msg) => {
                    kick.testing.kick(msg, [], member)
                        .then((complete) => {
                            assert(!complete);
                            assert.equal(channel.lastMessage.content, "Can't kick a staff member");
                            assert(guild.members.cache.has(user.id));
                            done();
                        })
                        .catch(err => done(err));
                });
        });

        it('uses no reason given', function (done) {
            channel.send(".kick", authorUser)
                .then((msg) => {
                    kick.testing.kick(msg, [], member)
                        .then((complete) => {
                            assert(complete);
                            assert.equal(channel.lastMessage.content, `Kicked ${user.tag}`);
                            assert(!guild.members.cache.has(user.id));
                            done();
                        })
                        .catch(err => done(err));
                });
        });
    });

    describe('main', function () {
        let authorMember;

        beforeEach(() => {
            const adminRole = testUtil.createRole(client, guild, { id: config.adminRoleID });
            authorMember = testUtil.createMember(client, guild, authorUser, [adminRole.id]);
        });

        it('checks author perm', function (done) {
            channel.send(".kick", user, member, [member])
                .then((msg) => {
                    kick.main(msg, [])
                        .then((complete) => {
                            assert(complete == undefined);
                            assert(guild.members.cache.has(user.id));
                            done();
                        })
                        .catch(err => done(err));
                });
        });

        it('returns on no mention or ID', function (done) {
            channel.send(".kick", authorUser, authorMember)
                .then((msg) => {
                    kick.main(msg, [])
                        .then((complete) => {
                            assert(!complete && complete !== undefined);
                            assert.equal(channel.lastMessage.content, "No member or ID specified");
                            assert(guild.members.cache.has(user.id));
                            done();
                        })
                        .catch(err => done(err));
                });
        });

        it('kicks by mention', function (done) {
            channel.send(".kick", authorUser, authorMember, [member])
                .then((msg) => {
                    kick.main(msg, [])
                        .then((complete) => {
                            assert(complete);
                            assert.equal(channel.lastMessage.content, `Kicked ${user.tag}`);
                            assert(!guild.members.cache.has(user.id));
                            done();
                        })
                        .catch(err => done(err));
                });
        });

        it('kicks by ID', function (done) {
            channel.send(".kick", authorUser, authorMember)
                .then((msg) => {
                    kick.main(msg, [`${member.id}`, `Reasoning`])
                        .then((complete) => {
                            assert(complete);
                            assert.equal(channel.lastMessage.content, `Kicked ${user.tag} for Reasoning`);
                            assert(!guild.members.cache.has(user.id));
                            done();
                        })
                        .catch(err => done(err));
                });
        });
    });
});

describe('mute', function () {
    const mute = require('../commands/mute.js');
    let client;
    let guild;
    let user;
    let member;

    beforeEach(() => {
        client = new Discord.Client();
        guild = testUtil.createGuild(client);
        user = testUtil.createUser(client, "test", "1234");
        member = testUtil.createMember(client, guild, user);
    });

    afterEach(() => {
        client.destroy();
    });

    before(() => {
        util.testing.silenceLogging(true);
    });

    after(() => {
        util.testing.silenceLogging(false);
    });

    describe('parseTime', function () {
        it('gets time', function () {
            const moment = require('moment');
            const time = mute.testing.parseTime(["", "60m"], member);

            assert.equal(time.time, 60);
            assert.equal(time.unit, 'm')
            assert(time.timeUnban instanceof moment);
        });

        it('checks first arg', function () {
            const time2 = mute.testing.parseTime([`<@!${member.id}>2d`], member);

            assert.equal(time2.time, 2);
            assert.equal(time2.unit, "d");
        });

        it('parses time with no space', function () {
            const time = mute.testing.parseTime([`${member.id}20h`], member);

            assert.equal(time.time, 20);
            assert.equal(time.unit, 'h');
        });

        it('has a default unit', function () {
            const time = mute.testing.parseTime(["", "30"], member);

            assert.equal(time.time, 30);
            assert.equal(time.unit, 'm');
        });
    })
})