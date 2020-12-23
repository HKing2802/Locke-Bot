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

    describe('getReason', function () {
        it('gets the reason', function () {
            const args = [`<@!${member.id}>`, "This", "is", "a", "test", "ban"];
            const reason = ban.testing.getReason(args, member);

            assert.equal(reason, "This is a test ban");
        });

        it('removes the tag', function () {
            const args = [`<@!${member.id}>This`, "is", "another", "test", "ban!"];
            const reason = ban.testing.getReason(args, member);

            assert.equal(reason, "This is another test ban!");
        });

        it('removes ID', function () {
            const args = [`${member.id}This`, "is", "a", "third", "ban!"];
            const reason = ban.testing.getReason(args, member);

            assert.equal(reason, "This is a third ban!");
        });
    });

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