const assert = require('assert').strict;
const testUtil = require('../discordTestUtility/discordTestUtility.js');
const Discord = require('Discord.js');
const util = require('../src/util.js');
require('hjson/lib/require-config');
const config = require('../config.hjson');
const db = require('../src/db.js');
const moment = require('moment');

describe('ban', function () {
    const ban = require('../commands/ban.js');
    const client = new Discord.Client();
    let guild;
    let user;
    let member;
    let channel;

    // Quiets the logger for test displays
    before(async () => {
        util.testing.silenceLogging(true);
        await db.connect();
    })

    // Reconstructs the testing environment before every test to ensure there is no inter-test problems
    beforeEach(() => {
        guild = testUtil.createGuild(client);
        user = testUtil.createUser(client, "test", "1234");
        member = testUtil.createMember(client, guild, user);
        channel = new testUtil.testChannel(guild);
    })

    after(async () => {
        await db.disconnect();
        util.testing.silenceLogging(false)
        client.destroy();
    })

    describe('parseTime', function () {
        it('gets time', function () {
            const time = ban.testing.parseTime(["", "60m"], member);

            assert.equal(time.time, '60');
            assert.equal(time.unit, 'm')
            assert(time.timeUnban instanceof moment);
        });

        it('checks first arg', function () {
            const time2 = ban.testing.parseTime([`<@!${member.id}>2d`], member);

            assert.equal(time2.time, '2');
            assert.equal(time2.unit, "d");
        });

        it('parses time with no space', function () {
            const time = ban.testing.parseTime([`${member.id}20h`], member);

            assert.equal(time.time, '20');
            assert.equal(time.unit, 'h');
        });

        it('has a default unit', function () {
            const time = ban.testing.parseTime(["", "30"], member);

            assert.equal(time.time, '30');
            assert.equal(time.unit, 'm');
        });

        it('returns if args is empty', function () {
            const time = ban.testing.parseTime([], member);

            assert.equal(time, undefined);
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

        it('records temp bans to db', function (done) {
            const msg = testUtil.createMessage(channel, '', user);
            ban.testing.ban(msg, ['', '1d'], member)
                .then((complete) => {
                    assert(complete);
                    assert.equal(channel.lastMessage.content, `Banned ${user.tag} for a day, No reason given.`);

                    // checks db
                    let numEntries = 0;
                    db.buildQuery(`SELECT * FROM temp_ban WHERE user_id = ${member.id}`)
                        .execute(result => {
                            numEntries += 1;
                            const timeDiff = moment(result[2]).diff(moment(result[1]).add('1', 'd'))
                            assert(timeDiff < 5000 && timeDiff >= 0);
                        })
                        .then(async () => {
                            assert.equal(numEntries, 1);
                            await db.buildQuery(`DELETE FROM temp_ban WHERE user_id = ${member.id} LIMIT 1`).execute()
                                .catch(err => { throw err });
                            done();
                        })
                        .catch(err => done(err));
                })
                .catch(err => done(err));
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
    let channel;
    let muteRole;
    let humanRole;
    let memberRole;
    let authorUser;
    let authorMember;
    let adminRole;

    beforeEach(() => {
        client = new Discord.Client();
        guild = testUtil.createGuild(client);
        user = testUtil.createUser(client, "test", "1234");
        member = testUtil.createMember(client, guild, user);
        channel = new testUtil.testChannel(guild);
        muteRole = testUtil.createRole(client, guild, { id: config.mutedRoleID }).role;
        humanRole = testUtil.createRole(client, guild, { id: config.humanRoleID }).role;
        memberRole = testUtil.createRole(client, guild, { id: config.memberRoleID }).role;
        authorUser = testUtil.createUser(client, "test user", "4321");
        authorMember = testUtil.createMember(client, guild, authorUser);
        adminRole = testUtil.createRole(client, guild, { id: config.adminRoleID }).role;
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
            const time = mute.testing.parseTime(["", "60m"], member);

            assert.equal(time.time, '60');
            assert.equal(time.unit, 'm')
            assert(time.timeUnmute instanceof moment);
        });

        it('checks first arg', function () {
            const time2 = mute.testing.parseTime([`<@!${member.id}>2d`], member);

            assert.equal(time2.time, '2');
            assert.equal(time2.unit, "d");
        });

        it('parses time with no space', function () {
            const time = mute.testing.parseTime([`${member.id}20h`], member);

            assert.equal(time.time, '20');
            assert.equal(time.unit, 'h');
        });

        it('has a default unit', function () {
            const time = mute.testing.parseTime(["", "30"], member);

            assert.equal(time.time, '30');
            assert.equal(time.unit, 'm');
        });

        it('returns if args is empty', function () {
            const time = mute.testing.parseTime([], member);

            assert.equal(time, undefined);
        });
    });

    describe('mute', function () {

        before(async function () {
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

        afterEach(function () {
            db.buildQuery(`DELETE FROM muted_users WHERE user_id = ${member.user.id} && name = '${user.username}' LIMIT 1`).execute();
        });

        after(async function () {
            await db.disconnect();
        });

        beforeEach(() => {
            member.roles.add(humanRole);
        });

        it('mutes', function (done) {
            channel.send('mute', authorUser, authorMember)
                .then((msg) => {
                    mute.testing.mute(msg, ['Reasoning'], member)
                        .then((complete) => {
                            assert(complete);
                            assert(member.roles.cache.has(muteRole.id));
                            assert(!(member.roles.cache.has(humanRole.id)));
                            assert(!(member.roles.cache.has(memberRole.id)));
                            assert.equal(channel.lastMessage.content, `Muted ${user.tag} for Reasoning`);

                            // checks db for entry
                            let numEntries = 0;
                            const query = db.buildQuery(`SELECT * FROM muted_users WHERE user_id = ${member.id}`);
                            query.execute(result => {
                                numEntries += 1;
                                assert.equal(result[0], member.id);
                                assert.equal(result[1], member.user.username);
                                assert.equal(result[2], 0)
                                assert.equal(result[4], null);
                            })
                                .then(() => {
                                    assert.equal(numEntries, 1);
                                    done();
                                });
                        })
                        .catch(err => done(err));
                });
        });

        it('checks target permission', function (done) {
            const adminRole = testUtil.createRole(client, guild, { id: config.adminRoleID }).role;
            member.roles.add(adminRole);
            channel.send('mute', authorUser, authorMember)
                .then((msg) => {
                    mute.testing.mute(msg, [], member)
                        .then((complete) => {
                            assert(!complete);
                            assert(!(member.roles.cache.has(muteRole.id)));
                            assert(member.roles.cache.has(humanRole.id));
                            assert.equal(channel.lastMessage.content, `Can't mute a staff member`);

                            // checks db to not have entry
                            let numEntries = 0;
                            const query = db.buildQuery(`SELECT * FROM muted_users WHERE user_id = ${member.id}`);
                            query.execute(result => {
                                numEntries += 1;
                            })
                                .then(() => {
                                    assert.equal(numEntries, 0);
                                    done();
                                });
                        })
                        .catch(err => done(err));
                });
        });

        it('handles member role', function (done) {
            member.roles.add(memberRole);
            channel.send('mute', authorUser, authorMember)
                .then((msg) => {
                    mute.testing.mute(msg, [], member)
                        .then((complete) => {
                            assert(complete);
                            assert(member.roles.cache.has(muteRole.id));
                            assert(!(member.roles.cache.has(humanRole.id)));
                            assert(!(member.roles.cache.has(memberRole.id)));
                            assert.equal(channel.lastMessage.content, `Muted ${user.tag}, No reason given`);

                            // checks db
                            let numEntries = 0;
                            const query = db.buildQuery(`SELECT * FROM muted_users WHERE user_id = ${member.id}`);
                            query.execute(result => {
                                numEntries += 1;
                                assert.equal(result[0], member.id);
                                assert.equal(result[1], user.username);
                                assert.equal(result[2], 1);
                                assert.equal(result[4], null);
                            })
                                .then(() => {
                                    assert.equal(numEntries, 1);
                                    done();
                                });
                        });
                });
        });

        it('gets time correctly', function (done) {
            channel.send('mute', authorUser, authorMember)
                .then((msg) => {
                    mute.testing.mute(msg, ["@person", "2d", "Reasoning"], member)
                        .then((complete) => {
                            assert(complete);
                            assert(member.roles.cache.has(muteRole.id));
                            assert(!(member.roles.cache.has(humanRole.id)));
                            assert.equal(channel.lastMessage.content, `Muted ${user.tag} for 2 days for Reasoning`);

                            // checks db
                            let numEntries = 0;
                            const query = db.buildQuery(`SELECT * FROM muted_users WHERE user_id = ${member.id}`);
                            query.execute(result => {
                                numEntries += 1;
                                assert.equal(result[0], member.id);
                                assert.equal(result[1], user.username);
                                assert.equal(result[2], 0);
                                assert(moment(result[4]).diff(moment(result[3]).add('2', 'd')) < 5000 && moment(result[4]).diff(moment(result[3]).add('2', 'd')) >= 0);
                            })
                                .then(() => {
                                    assert.equal(numEntries, 1);
                                    done();
                                });
                        });
                });
        });
    });

    describe('main', function () {

        before(async function () {
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

        afterEach(function () {
            db.buildQuery(`DELETE FROM muted_users WHERE user_id = ${member.user.id} && name = '${user.username}' LIMIT 1`).execute();
        });

        after(async function () {
            await db.disconnect();
        });

        beforeEach(() => {
            member.roles.add(humanRole);
        });

        it('mutes on mention', function (done) {
            authorMember.roles.add(adminRole);
            channel.send('mute', authorUser, authorMember, [member])
                .then((msg) => {
                    mute.main(msg, ['Reasoning'])
                        .then((complete) => {
                            assert(complete);
                            assert(member.roles.cache.has(muteRole.id));
                            assert(!(member.roles.cache.has(humanRole.id)));
                            assert(!(member.roles.cache.has(memberRole.id)));
                            assert.equal(channel.lastMessage.content, `Muted ${user.tag} for Reasoning`);

                            // checks db for entry
                            let numEntries = 0;
                            const query = db.buildQuery(`SELECT * FROM muted_users WHERE user_id = ${member.id}`);
                            query.execute(result => {
                                numEntries += 1;
                                assert.equal(result[0], member.id);
                                assert.equal(result[1], member.user.username);
                                assert.equal(result[2], 0)
                                assert.equal(result[4], null);
                            })
                                .then(() => {
                                    assert.equal(numEntries, 1);
                                    done();
                                });
                        })
                        .catch(err => done(err));
                });
        });

        it('mutes on ID', function (done) {
            authorMember.roles.add(adminRole);
            channel.send('mute', authorUser, authorMember)
                .then((msg) => {
                    mute.main(msg, [`${member.id}`, 'Reasoning'])
                        .then((complete) => {
                            assert(complete);
                            assert.equal(channel.lastMessage.content, `Muted ${user.tag} for Reasoning`);

                            // checks db for entry
                            let numEntries = 0;
                            const query = db.buildQuery(`SELECT * FROM muted_users WHERE user_id = ${member.id}`);
                            query.execute(result => {
                                numEntries += 1;
                                assert.equal(result[0], member.id);
                                assert.equal(result[1], member.user.username);
                                assert.equal(result[2], 0)
                                assert.equal(result[4], null);
                            })
                                .then(() => {
                                    assert.equal(numEntries, 1);
                                    done();
                                });
                        })
                        .catch(err => done(err));
                });
        });

        it('checks auther perm', function (done) {
            channel.send('mute', authorUser, authorMember, [member])
                .then((msg) => {
                    mute.main(msg, ['Reasoning'])
                        .then((complete) => {
                            assert.equal(complete, undefined);
                            assert(!(member.roles.cache.has(muteRole.id)));
                            assert(member.roles.cache.has(humanRole.id));
                            assert.equal(channel.lastMessage.content, `mute`);

                            // checks db to not have entry
                            let numEntries = 0;
                            const query = db.buildQuery(`SELECT * FROM muted_users WHERE user_id = ${member.id}`);
                            query.execute(result => {
                                numEntries += 1;
                            })
                                .then(() => {
                                    assert.equal(numEntries, 0);
                                    done();
                                });
                        })
                        .catch(err => done(err));
                });
        });

        it('responds on no mention or ID', function (done) {
            authorMember.roles.add(adminRole);
            channel.send('mute', authorUser, authorMember)
                .then((msg) => {
                    mute.main(msg, [])
                        .then((complete) => {
                            assert.equal(complete, false);
                            assert.equal(channel.lastMessage.content, "No member or ID specified");
                            assert(member.roles.cache.has(humanRole.id));
                            assert(!(member.roles.cache.has(muteRole.id)));

                            // checks db to not have entry
                            let numEntries = 0;
                            const query = db.buildQuery(`SELECT * FROM muted_users WHERE user_id = ${member.id}`);
                            query.execute(result => {
                                numEntries += 1;
                            })
                                .then(() => {
                                    assert.equal(numEntries, 0);
                                    done();
                                });
                        })
                        .catch(err => done(err));
                });
        });
    });
});

describe('unmute', function () {
    const unmute = require('../commands/unmute.js');
    let client;
    let guild;
    let user;
    let member;
    let channel;
    let muteRole;
    let humanRole;
    let memberRole;
    let authorUser;
    let authorMember;
    let adminRole;

    beforeEach(() => {
        client = new Discord.Client();
        guild = testUtil.createGuild(client);
        user = testUtil.createUser(client, "test", "1234");
        member = testUtil.createMember(client, guild, user);
        channel = new testUtil.testChannel(guild);
        mutedRole = testUtil.createRole(client, guild, { id: config.mutedRoleID }).role;
        humanRole = testUtil.createRole(client, guild, { id: config.humanRoleID }).role;
        memberRole = testUtil.createRole(client, guild, { id: config.memberRoleID }).role;
        authorUser = testUtil.createUser(client, "test user", "4321");
        authorMember = testUtil.createMember(client, guild, authorUser);
        adminRole = testUtil.createRole(client, guild, { id: config.adminRoleID }).role;
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

    describe('unmute', function () {

        before(async function () {
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

        after(async function () {
            await db.disconnect();
        });

        beforeEach(() => {
            member.roles.add(mutedRole);
        });

        it('unmutes', function (done) {
            db.buildQuery(`INSERT INTO muted_users(user_id, name, member) VALUES (${member.id}, '${user.username}', 0)`).execute();

            channel.send('unmute', authorUser, authorMember)
                .then((msg) => {
                    unmute.testing.unmute(msg, ['Reasoning'], member)
                        .then((complete) => {
                            assert(complete);
                            assert(member.roles.cache.has(humanRole.id));
                            assert(!(member.roles.cache.has(mutedRole.id)));
                            assert(!(member.roles.cache.has(memberRole.id)));
                            assert.equal(channel.lastMessage.content, `Unmuted ${user.tag} for Reasoning`);
                            done();
                        })
                        .catch(err => done(err));
                });
        });

        it('Omits No reason given', function (done) {
            db.buildQuery(`INSERT INTO muted_users(user_id, name, member) VALUES (${member.id}, '${user.username}', 0)`).execute();

            channel.send('unmute', authorUser, authorMember)
                .then((msg) => {
                    unmute.testing.unmute(msg, [], member)
                        .then((complete) => {
                            assert(complete);
                            assert(member.roles.cache.has(humanRole.id));
                            assert(!(member.roles.cache.has(mutedRole.id)));
                            assert.equal(channel.lastMessage.content, `Unmuted ${user.tag}`);
                            done();
                        })
                        .catch(err => done(err));
                });
        });

        it('gives back member role', function (done) {
            db.buildQuery(`INSERT INTO muted_users(user_id, name, member) VALUES (${member.id}, '${user.username}', 1)`).execute();

            channel.send('unmute', authorUser, authorMember)
                .then((msg) => {
                    unmute.testing.unmute(msg, [], member)
                        .then((complete) => {
                            assert(complete);
                            assert(member.roles.cache.has(humanRole.id));
                            assert(member.roles.cache.has(memberRole.id));
                            assert(!(member.roles.cache.has(mutedRole.id)));
                            assert.equal(channel.lastMessage.content, `Unmuted ${user.tag}`);
                            done();
                        })
                        .catch(err => done(err));
                });
        });

        it('checks target permission', function (done) {
            member.roles.add(adminRole);
            channel.send('unmute', authorUser, authorMember)
                .then((msg) => {
                    unmute.testing.unmute(msg, [], member)
                        .then((complete) => {
                            assert(!complete);
                            assert(member.roles.cache.has(mutedRole.id));
                            assert(!(member.roles.cache.has(humanRole.id)));
                            assert(!(member.roles.cache.has(memberRole.id)));
                            assert.equal(channel.lastMessage.content, "Can't unmute a staff member");
                            done();
                        })
                        .catch(err => done(err));
                });
        });

        it('checks if target is muted', function (done) {
            member.roles.remove(mutedRole);
            member.roles.add(humanRole);

            channel.send('unmute', authorUser, authorMember)
                .then((msg) => {
                    unmute.testing.unmute(msg, [], member)
                        .then((complete) => {
                            assert(!complete);
                            assert(member.roles.cache.has(humanRole.id));
                            assert(!(member.roles.cache.has(mutedRole.id)));
                            assert.equal(channel.lastMessage.content, "Member is not muted");
                            done();
                        })
                        .catch(err => done(err));
                });
        });

        it('removes db entry', function (done) {
            db.buildQuery(`INSERT INTO muted_users(user_id, name, member) VALUES (${member.id}, '${user.username}', 0)`).execute();

            channel.send('unmute', authorUser, authorMember)
                .then((msg) => {
                    unmute.testing.unmute(msg, ['Reasoning'], member)
                        .then((complete) => {
                            assert(complete);
                            assert(member.roles.cache.has(humanRole.id));
                            assert(!(member.roles.cache.has(mutedRole.id)));
                            assert(!(member.roles.cache.has(memberRole.id)));
                            assert.equal(channel.lastMessage.content, `Unmuted ${user.tag} for Reasoning`);

                            // checks db for entry;
                            db.buildQuery(`SELECT * FROM muted_users WHERE user_id = ${member.id}`)
                                .execute(result => {
                                    assert(false);
                                })
                                .then(() => {
                                    done();
                                });
                        })
                        .catch(err => done(err));
                });
        })
    });

    describe('main', function () {

        before(async function () {
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

        after(async function () {
            await db.disconnect();
        });

        beforeEach(() => {
            member.roles.add(mutedRole);
            guild.members.cache.set(member.id, member);
            authorMember.roles.add(adminRole);
        });

        it('checks author perm', function (done) {
            authorMember.roles.remove(adminRole);
            channel.send('unmute', authorUser, authorMember)
                .then((msg) => {
                    unmute.main(msg, [])
                        .then((complete) => {
                            assert.equal(complete, undefined);
                            assert.equal(channel.lastMessage.content, 'unmute');
                            done();
                        })
                        .catch(err => done(err));
                });
        });

        it('checks for everyone ping', function (done) {
            channel.send('unmute', authorUser, authorMember, [], {}, true)
                .then((msg) => {
                    unmute.main(msg, [])
                        .then((complete) => {
                            assert.equal(complete, false);
                            assert.equal(channel.lastMessage.content, "I can't unmute everyone");
                            done();
                        })
                        .catch(err => done(err));
                });
        });

        it('responds on no member or ID', function (done) {
            channel.send('unmute', authorUser, authorMember)
                .then((msg) => {
                    unmute.main(msg, [])
                        .then((complete) => {
                            assert.equal(complete, false);
                            assert.equal(channel.lastMessage.content, "No member or ID specified");
                            done();
                        })
                        .catch(err => done(err));
                });
        });

        it('unmutes on mention', function (done) {
            db.buildQuery(`INSERT INTO muted_users(user_id, name, member) VALUES (${member.id}, '${user.username}', 0)`).execute();

            channel.send('unmute', authorUser, authorMember, [member])
                .then((msg) => {
                    unmute.main(msg, ['Reasoning'])
                        .then((complete) => {
                            assert(complete);
                            assert(member.roles.cache.has(humanRole.id));
                            assert(!(member.roles.cache.has(mutedRole.id)));
                            assert(!(member.roles.cache.has(memberRole.id)));
                            assert.equal(channel.lastMessage.content, `Unmuted ${user.tag} for Reasoning`);
                            done();
                        })
                        .catch(err => done(err));
                });
        });

        it('unmutes on ID', function (done) {
            db.buildQuery(`INSERT INTO muted_users(user_id, name, member) VALUES (${member.id}, '${user.username}', 1)`).execute();

            channel.send('unmute', authorUser, authorMember)
                .then((msg) => {
                    unmute.main(msg, [`${member.id}`, "Test", "Reasoning"])
                        .then((complete) => {
                            assert(complete);
                            assert(member.roles.cache.has(humanRole.id));
                            assert(member.roles.cache.has(memberRole.id));
                            assert(!(member.roles.cache.has(mutedRole.id)));
                            assert.equal(channel.lastMessage.content, `Unmuted ${user.tag} for Test Reasoning`);
                            done();
                        })
                        .catch(err => done(err));
                });
        });
    });
});

describe('snipe', function () {
    const snipe = require('../commands/snipe.js');
    let client = new Discord.Client();
    let guild = testUtil.createGuild(client);
    let channel = new testUtil.testChannel(guild, { name: "test channel" });
    let user = testUtil.createUser(client, "test user", "1234");
    let member = testUtil.createMember(client, guild, user);
    let userAuthor = testUtil.createUser(client, "test author", "1234");
    let adminRole = testUtil.createRole(client, guild, { id: config.adminRoleID }).role;
    let memberAuthor = testUtil.createMember(client, guild, userAuthor, [adminRole.id]);

    before(async () => {
        util.testing.silenceLogging(true);
        await db.connect();
    });

    beforeEach(() => {
        client.destroy();
        client = new Discord.Client();
        guild = testUtil.createGuild(client);
        channel = new testUtil.testChannel(guild, { name: "test channel" });
        user = testUtil.createUser(client, "test user", "1234");
        member = testUtil.createMember(client, guild, user);
        userAuthor = testUtil.createUser(client, "test author", "1234");
        adminRole = testUtil.createRole(client, guild, { id: config.adminRoleID }).role;
        memberAuthor = testUtil.createMember(client, guild, userAuthor, [adminRole.id]);
    });

    after(async () => {
        client.destroy();
        await db.disconnect();
        util.testing.silenceLogging(false);
    });

    describe('Escape Message', function () {

        it('returns on no pings', function () {
            const msg = snipe.testing.escapeMessage("test message");

            assert.equal(msg, "test message");
        })

        it('escapes single ping', function () {
            const msg = snipe.testing.escapeMessage(`test <@!${member.id}> ping`, guild);

            assert.equal(msg, "test @test user#1234 ping");
        });

        it('defaults to id', function (done) {
            member.kick()
                .then((m) => {
                    const msg = snipe.testing.escapeMessage(`test <@!${m.id}> id ping`, guild);

                    assert.equal(msg, `test @${m.id} id ping`);
                    done();
                })
                .catch(err => done(err));
        });

        it('defaults to id on no guild', function () {
            const msg = snipe.testing.escapeMessage(`test <@!${member.id}> id ping 2`);

            assert.equal(msg, `test @${member.id} id ping 2`);
        });

        it('escapes 2 pings', function () {
            const user2 = testUtil.createUser(client, "user2", "4312");
            const member2 = testUtil.createMember(client, guild, user2);
            const msg = snipe.testing.escapeMessage(`test <@!${member.id}> dual <@!${member2.id}> ping`, guild);

            assert.equal(msg, "test @test user#1234 dual @user2#4312 ping");
        });

        it('escapes role pings', function () {
            role = testUtil.createRole(client, guild, { name: "test role" }).role;
            const msg = snipe.testing.escapeMessage(`test <@&${role.id}> role`, guild);

            assert.equal(msg, "test @test role role");
        });

        it('escapes @everyone', function () {
            const msg = snipe.testing.escapeMessage(`test @everyone big ping`, guild);

            assert.equal(msg, 'test @?everyone big ping');
        });

        it('escapes @here', function () {
            const msg = snipe.testing.escapeMessage(`test @here big ping`, guild);

            assert.equal(msg, 'test @?here big ping');
        });

        it('escapes mixed', function () {
            role = testUtil.createRole(client, guild, { name: "test role" }).role;
            const msg = snipe.testing.escapeMessage(`test @here message <@!${member.id}> and <@&${role.id}> so @everyone`, guild);

            assert.equal(msg, `test @?here message @test user#1234 and @test role so @?everyone`);
        });
    });

    describe('Send Large Message', function () {
        it('sends a message', function (done) {
            snipe.testing.sendLargeMessage(["test message"], channel)
                .then((msgs) => {
                    assert.equal(msgs.length, 1);
                    assert.equal(channel.lastMessage.content, "test message");
                    done();
                })
                .catch(err => done(err));
        });

        it('combines multiple contents', function (done) {
            snipe.testing.sendLargeMessage(["test message", "test message 2"], channel)
                .then((msgs) => {
                    assert.equal(msgs.length, 1);
                    assert.equal(channel.lastMessage.content, "test message\ntest message 2");
                    done();
                })
                .catch(err => done(err));
        });

        it('sends multiple messages', function (done) {
            // 2000 characters
            const longmsg = 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus. Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum. Nam quam nunc, blandit vel, luctus pulvinar, hendrerit id, lorem. Maecenas nec odio et ante tincidunt tempus. Donec vitae sapien ut libero venenatis faucibus. Nullam quis ante. Etiam sit amet orci eget eros faucibus tincidunt. Duis leo. Sed fringilla mauris sit amet nibh. Donec sodales sagittis magna. Sed consequat, leo eget bibendum sodales, augue velit cursus nunc, quis gravida magna mi a libero. Fusce vulputate eleifend sapien. Vestibulum purus quam, scelerisque ut, mollis sed, nonummy id, metus. Nullam accumsan lorem in dui. Cras ultricies mi eu turpis hendrerit fringilla. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; In ac dui quis mi consectetuer lacinia. Nam pretium turpis et arcu. Duis arcu tortor, suscipit eget, imperdiet nec, imperdiet iaculis, ipsum. Sed aliquam ultrices mauris. Integer ante arcu, accumsan a, consectetuer eget, posuere ut, mauris. Praesent adipiscing. Phasellus ullamcorper ipsum rutrum nunc. Nunc nonummy metus. Vestib';

            snipe.testing.sendLargeMessage([longmsg, "test message", "a greater test message"], channel)
                .then((msgs) => {
                    assert.equal(msgs.length, 2);
                    assert.equal(msgs[0].content.length, longmsg.length);
                    assert.equal(msgs[1].content, "test message\na greater test message");
                    assert.equal(channel.lastMessage.content, "test message\na greater test message");
                    assert.equal(channel.messages.cache.get(msgs[0].id).content, longmsg);
                    done();
                })
                .catch(err => done(err));
        });

        it('checks combined length', function (done) {
            // 1950 characters
            const longmsg = 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus. Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum. Nam quam nunc, blandit vel, luctus pulvinar, hendrerit id, lorem. Maecenas nec odio et ante tincidunt tempus. Donec vitae sapien ut libero venenatis faucibus. Nullam quis ante. Etiam sit amet orci eget eros faucibus tincidunt. Duis leo. Sed fringilla mauris sit amet nibh. Donec sodales sagittis magna. Sed consequat, leo eget bibendum sodales, augue velit cursus nunc, quis gravida magna mi a libero. Fusce vulputate eleifend sapien. Vestibulum purus quam, scelerisque ut, mollis sed, nonummy id, metus. Nullam accumsan lorem in dui. Cras ultricies mi eu turpis hendrerit fringilla. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; In ac dui quis mi consectetuer lacinia. Nam pretium turpis et arcu. Duis arcu tortor, suscipit eget, imperdiet nec, imperdiet iaculis, ipsum. Sed aliquam ultrices mauris. Integer ante arcu, accumsan a, consectetuer eget, posuere ut, mauris. Praesent adipiscing. Phasellus ullamco';
            // 100 characters
            const shortermsg = 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean m';

            snipe.testing.sendLargeMessage([longmsg, shortermsg], channel)
                .then((msgs) => {
                    assert.equal(msgs.length, 2);
                    assert.equal(msgs[0].content, longmsg);
                    assert.equal(msgs[1].content, shortermsg);
                    assert.equal(channel.lastMessage.content, shortermsg);
                    assert.equal(channel.messages.cache.get(msgs[0].id).content, longmsg);
                    done();
                })
                .catch(err => done(err));
        });
    });

    describe('getDeleted', function () {

        after(async () => {
            // sets persistent snipeData to default values
            const persistent = require('../persistent.json');
            const { writeFile } = require('fs');
            persistent.snipeData.time = 0;
            persistent.snipeData.msgs = [];
            await writeFile('./persistent.json', JSON.stringify(persistent, null, 2), (err) => {
                if (err) throw err;
            })

            await db.buildQuery(`DELETE FROM messages WHERE channel_id = 333`).execute()
                .catch(err => done(err));
        });

        it('gets deleted messages', function (done) {
            // loads test data
            // test data identified by channel_id is 333
            db.buildQuery(`INSERT INTO messages (id, user_id, channel_id, send_time, content) 
                VALUES
                (21, ${member.id}, 333, '2021-01-11 5:21:00', 'Test content'),
                (22, ${member.id}, 333, '2021-01-11 5:22:00', 'Test content 2'),
                (23, 456, 333, '2021-01-11 6:08:00', 'Test content 3')`).execute()
                .catch(err => done(err));

            const msg = testUtil.createMessage(channel, ".snipe");
            snipe.testing.getDeleted(msg, [], member)
                .then((complete) => {
                    assert(complete);
                    assert.equal(channel.lastMessage.content, "[1] 1/11 5:21:00 - Test content\n[2] 1/11 5:22:00 - Test content 2");
                    done();
                })
                .catch(err => done(err));
        });

        it('sends no messages found', function (done) {
            const msg = testUtil.createMessage(channel);
            snipe.testing.getDeleted(msg, [], member)
                .then((complete) => {
                    assert(complete);
                    assert.equal(channel.lastMessage.content, "No messages found");
                    done();
                })
                .catch(err => done(err));
        });

        it('caps messages', function (done) {
            // loads test data
            // test data identified by channel_id is 333
            db.buildQuery(`INSERT INTO messages (id, user_id, channel_id, send_time, content)
                VALUES
                (24, ${member.id}, 333, '2021-01-11 06:16:55', 'Test Content1'),
                (25, ${member.id}, 333, '2021-01-11 06:16:55', 'Test Content2'),
                (26, ${member.id}, 333, '2021-01-11 06:16:55', 'Test Content3'),
                (27, ${member.id}, 333, '2021-01-11 06:16:55', 'Test Content4'),
                (28, ${member.id}, 333, '2021-01-11 06:16:55', 'Test Content5'),
                (29, ${member.id}, 333, '2021-01-11 06:16:55', 'Test Content6'),
                (30, ${member.id}, 333, '2021-01-11 06:16:55', 'Test Content7'),
                (31, ${member.id}, 333, '2021-01-11 06:16:55', 'Test Content8'),
                (32, ${member.id}, 333, '2021-01-11 06:16:55', 'Test Content9'),
                (33, ${member.id}, 333, '2021-01-11 06:16:55', 'Test Content10'),
                (34, ${member.id}, 333, '2021-01-11 06:16:55', 'Test Content11')`).execute()
                .catch(err => done(err));

            const msg = testUtil.createMessage(channel);
            snipe.testing.getDeleted(msg, [], member)
                .then((complete) => {
                    assert(complete);
                    assert.equal(channel.lastMessage.content.substr(-2), '10');
                    assert.equal(channel.lastMessage.content.length, 331);
                    done();
                })
                .catch(err => done(err));
        });

        it('removes cap with argument', function (done) {
            // load test data
            // test data identified by channel_id is 333
            db.buildQuery(`INSERT INTO messages (id, user_id, channel_id, send_time, content)
                VALUES
                (35, ${member.id}, 333, '2021-01-11 06:16:55', 'Test Content1'),
                (36, ${member.id}, 333, '2021-01-11 06:16:55', 'Test Content2'),
                (37, ${member.id}, 333, '2021-01-11 06:16:55', 'Test Content3'),
                (38, ${member.id}, 333, '2021-01-11 06:16:55', 'Test Content4'),
                (39, ${member.id}, 333, '2021-01-11 06:16:55', 'Test Content5'),
                (40, ${member.id}, 333, '2021-01-11 06:16:55', 'Test Content6'),
                (41, ${member.id}, 333, '2021-01-11 06:16:55', 'Test Content7'),
                (42, ${member.id}, 333, '2021-01-11 06:16:55', 'Test Content8'),
                (43, ${member.id}, 333, '2021-01-11 06:16:55', 'Test Content9'),
                (44, ${member.id}, 333, '2021-01-11 06:16:55', 'Test Content10'),
                (45, ${member.id}, 333, '2021-01-11 06:16:55', 'Test Content11')`).execute()
                .catch(err => done(err));

            const msg = testUtil.createMessage(channel);
            snipe.testing.getDeleted(msg, ['', 'all'], member)
                .then((complete) => {
                    assert(complete);
                    assert.equal(channel.lastMessage.content.substr(-2), '11');
                    assert.equal(channel.lastMessage.content.length, 366);
                    done();
                })
                .catch(err => done(err));
        });

        it('saves persistent data', function (done) {
            // loads test data
            // test data identified by channel_id is 333
            db.buildQuery(`INSERT INTO messages (id, user_id, channel_id, send_time, content)
                VALUES
                (46, ${member.id}, 333, '2021-01-13 5:18:00', 'test content'),
                (47, ${member.id}, 333, '2021-01-13 5:19:00', 'test content 2')`).execute()
                .catch(err => done(err));

            const msg = testUtil.createMessage(channel);
            snipe.testing.getDeleted(msg, [], member)
                .then((complete) => {
                    const persistent = require('../persistent.json');
                    assert(complete);
                    assert(moment(persistent.snipeData.time).diff(moment()) < 1000);
                    assert.equal(persistent.snipeData.msgs[0], 46);
                    assert.equal(persistent.snipeData.msgs[1], 47);
                    assert.equal(persistent.snipeData.msgs.length, 2);
                    done();
                })
                .catch(err => done(err));
        });
    });

    describe('getEdits', function () {
        const persistent = require('../persistent.json');
        const { writeFile } = require('fs');

        after(async () => {
            // sets persistent snipeData to default values
            persistent.snipeData.time = 0;
            persistent.snipeData.msgs = [];
            await writeFile('./persistent.json', JSON.stringify(persistent, null, 2), (err) => {
                if (err) throw err;
            })

            await db.buildQuery(`DELETE FROM messages WHERE channel_id = 333`).execute()
                .catch(err => { throw err });
            await db.buildQuery(`DELETE FROM edits WHERE length(id) = 2`).execute()
                .catch(err => { throw err })
        });

        it('gets edits', function (done) {
            async function loadData() {
                // loads test data
                // test data identified by messages.channel_id being 333
                await db.buildQuery(`INSERT INTO messages (id, user_id, channel_id, send_time, content)
                VALUES
                (100, ${member.id}, 333, '2021-01-13 7:20:00', 'Test Message')`).execute()
                    .catch(err => done(err));

                // test data identified by length of id < 2
                await db.buildQuery(`INSERT INTO edits (id, msg_id, num, edit_time, content)
                VALUES
                (11, 100, 1, '2021-01-13 7:25:00', 'Test Edit'),
                (12, 100, 2, '2021-01-13 7:25:00', 'Test Edit 2')`).execute()
                    .catch(err => done(err));

                persistent.snipeData.time = moment().valueOf();
                persistent.snipeData.msgs = [100];
                await writeFile('./persistent.json', JSON.stringify(persistent, null, 2), (err) => {
                    if (err) done(err);
                });

                new testUtil.testChannel(guild, { name: "test", id: 333 });

            }

            const msg = testUtil.createMessage(channel);
            loadData().then(() => {
                snipe.testing.getEdits(msg, [], 1)
                    .then((complete) => {
                        assert(complete);
                        const msgContent = channel.lastMessage.content.split('\n');
                        assert.equal(msgContent[0], `Sent At:\t\t 2021-01-13 07:20:00\t\tAuthor:\t @${member.user.tag}`);
                        assert.equal(msgContent[1].substr(-16), "Channel:   #test");
                        assert.equal(msgContent[2], "Oldest")
                        assert.equal(msgContent[3], `[1] 2021-01-13 7:25:00 - Test Edit`);
                        assert.equal(msgContent[4], `[2] 2021-01-13 7:25:00 - Test Edit 2`);
                        assert.equal(msgContent[5], `2021-01-13 07:20:00 - Test Message`);
                        assert.equal(msgContent[6], "Current");

                        const msgTimestamp = moment(msgContent[1].substr(14, 19));
                        assert(moment().diff(msgTimestamp) < 5000 && moment().diff(msgTimestamp) >= 0);
                        done();
                    })
                    .catch(err => done(err))
            })
                .catch(err => done(err));
        });

        it('sends no edits found', function (done) {
            async function loadData() {
                // loads test data
                // test data identified by messages.channel_id being 333
                await db.buildQuery(`INSERT INTO messages (id, user_id, channel_id, send_time, content)
                VALUES
                (101, ${member.id}, 333, '2021-01-14 00:02:00', 'Test Message')`).execute()
                    .catch(err => done(err));

                persistent.snipeData.time = moment().valueOf();
                persistent.snipeData.msgs = [100, 101];
                await writeFile('./persistent.json', JSON.stringify(persistent, null, 2), (err) => {
                    if (err) done(err);
                });

                new testUtil.testChannel(guild, { name: "test", id: 333 });
            }

            const msg = testUtil.createMessage(channel);
            loadData().then(() => {
                snipe.testing.getEdits(msg, [], 2)
                    .then((complete) => {
                        assert(complete);
                        const msgContent = channel.lastMessage.content.split('\n');
                        assert.equal(msgContent[0], `Sent At:\t\t 2021-01-14 00:02:00\t\tAuthor:\t @${member.user.tag}`);
                        assert.equal(msgContent[1].substr(-16), "Channel:   #test");
                        assert.equal(msgContent[2], "No edits found");
                        assert.equal(msgContent[3], "2021-01-14 00:02:00 - Test Message");

                        const msgTimestamp = moment(msgContent[1].substr(14, 19));
                        assert(moment().diff(msgTimestamp) < 5000 && moment().diff(msgTimestamp) >= 0);
                        done();
                    })
                    .catch(err => done(err));
            })
                .catch(err => done(err));
        });

        it('handles nonexistent channel and member', function (done) {
            async function loadData() {
                // loads test data
                // test data identified by messages.channel_id being 333
                await db.buildQuery(`INSERT INTO messages (id, user_id, channel_id, send_time, content)
                VALUES
                (102, 11, 333, '2021-01-14 00:10:00', 'Test Message 2')`).execute()
                    .catch(err => done(err));

                persistent.snipeData.time = moment().valueOf();
                persistent.snipeData.msgs = [102];
                await writeFile('./persistent.json', JSON.stringify(persistent, null, 2), (err) => {
                    if (err) done(err);
                });

            }

            const msg = testUtil.createMessage(channel);
            loadData().then(() => {
                snipe.testing.getEdits(msg, [], 1)
                    .then((complete) => {
                        assert(complete);
                        const msgContent = channel.lastMessage.content.split('\n');
                        assert.equal(msgContent[0], `Sent At:\t\t 2021-01-14 00:10:00\t\tAuthor:\t ???`);
                        assert.equal(msgContent[1].substr(-14), "Channel:   ???");
                        assert.equal(msgContent[2], "No edits found");
                        assert.equal(msgContent[3], "2021-01-14 00:10:00 - Test Message 2");

                        const msgTimestamp = moment(msgContent[1].substr(14, 19));
                        assert(moment().diff(msgTimestamp) < 5000 && moment().diff(msgTimestamp) >= 0);
                        done();
                    })
                    .catch(err => done(err));
            })
                .catch(err => done(err));
        });

        it('returns on no message data', function (done) {
            async function loadData() {
                // loads test data
                persistent.snipeData.time = moment().valueOf();
                persistent.snipeData.msgs = [103];
                await writeFile('./persistent.json', JSON.stringify(persistent, null, 2), (err) => {
                    if (err) done(err);
                });
            }

            const msg = testUtil.createMessage(channel);
            loadData().then(() => {
                snipe.testing.getEdits(msg, [], 1)
                    .then((complete) => {
                        assert.equal(complete, false);
                        assert.equal(channel.lastMessage, null);
                        done();
                    })
                    .catch(err => done(err));
            })
                .catch(err => done(err));
        });

        it('returns on bad edit number', function (done) {
            async function loadData() {
                // loads test data
                persistent.snipeData.time = moment().subtract('29', 'm').subtract('50', 's').valueOf();
                persistent.snipeData.msgs = [1, 2, 3];
                await writeFile('./persistent.json', JSON.stringify(persistent, null, 2), (err) => {
                    if (err) done(err);
                });
            }

            const msg = testUtil.createMessage(channel);
            loadData().then(() => {
                snipe.testing.getEdits(msg, [], 5)
                    .then((complete) => {
                        assert.equal(complete, false);
                        assert.equal(channel.lastMessage.content, "Incorrect message number: must be within 1-3");
                        done();
                    })
                    .catch(err => done(err));
            })
                .catch(err => done(err));
        });

        it('returns on bad time', function (done) {
            async function loadData() {
                // loads test data
                persistent.snipeData.time = moment().subtract('30', 'm').subtract('1', 's').valueOf();
                persistent.snipeData.msgs = [102];
                await writeFile('./persistent.json', JSON.stringify(persistent, null, 2), (err) => {
                    if (err) done(err);
                });
            }

            const msg = testUtil.createMessage(channel);
            loadData().then(() => {
                snipe.testing.getEdits(msg, [], 1)
                    .then((complete) => {
                        assert.equal(complete, false);
                        assert.equal(channel.lastMessage.content, "Snipe has not been used to get deleted messages in the past half-hour");
                        done();
                    })
                    .catch(err => done(err));
            })
                .catch(err => done(err));
        });

        it('limits number of edits', function (done) {
            async function loadData() {
                // loads test data
                // test data identified by messages.channel_id being 333
                await db.buildQuery(`INSERT INTO messages (id, user_id, channel_id, send_time, content)
                VALUES
                (104, ${member.id}, 333, '2021-01-14 01:05:00', 'Test Message')`).execute()
                    .catch(err => done(err));

                // test data identified by length of id = 3
                await db.buildQuery(`INSERT INTO edits (id, msg_id, num, edit_time, content)
                VALUES
                (13, 104, 1, '2021-01-14 00:49:00', 'Test Edit'),
                (14, 104, 2, '2021-01-14 00:49:00', 'Test Edit 2'),
                (15, 104, 3, '2021-01-14 00:49:00', 'Test Edit 3'),
                (16, 104, 4, '2021-01-14 00:49:00', 'Test Edit 4'),
                (17, 104, 5, '2021-01-14 00:49:00', 'Test Edit 5'),
                (18, 104, 6, '2021-01-14 00:49:00', 'Test Edit 6'),
                (19, 104, 7, '2021-01-14 00:49:00', 'Test Edit 7'),
                (20, 104, 8, '2021-01-14 00:49:00', 'Test Edit 8'),
                (21, 104, 9, '2021-01-14 00:49:00', 'Test Edit 9'),
                (22, 104, 10, '2021-01-14 00:49:00', 'Test Edit 10'),
                (23, 104, 11, '2021-01-14 00:49:00', 'Test Edit 11')`).execute()
                    .catch(err => done(err));

                persistent.snipeData.time = moment().valueOf();
                persistent.snipeData.msgs = [104];
                await writeFile('./persistent.json', JSON.stringify(persistent, null, 2), (err) => {
                    if (err) done(err);
                });

                new testUtil.testChannel(guild, { name: "test", id: 333 });
            }

            const msg = testUtil.createMessage(channel);
            loadData().then(() => {
                snipe.testing.getEdits(msg, [], 1)
                    .then((complete) => {
                        assert(complete);
                        const msgContents = channel.lastMessage.content.split('\n');
                        assert.equal(msgContents[12], `[10] 2021-01-14 0:49:00 - Test Edit 10`);
                        assert.equal(msgContents[13], `--- 1 More Edit not Shown ---`);
                        assert.equal(msgContents[14], `2021-01-14 01:05:00 - Test Message`);
                        assert.equal(msgContents[15], `Current`);
                        done();
                    })
                    .catch(err => done(err));
            })
                .catch(err => done(err));
        });

        it('removes limit on option', function (done) {
            async function loadData() {
                // loads test data
                // test data identified by messages.channel_id being 333
                await db.buildQuery(`INSERT INTO messages (id, user_id, channel_id, send_time, content)
                VALUES
                (105, ${member.id}, 333, '2021-01-14 01:05:00', 'Test Message')`).execute()
                    .catch(err => done(err));

                // test data identified by length of id < 2
                await db.buildQuery(`INSERT INTO edits (id, msg_id, num, edit_time, content)
                VALUES
                (24, 105, 1, '2021-01-14 00:49:00', 'Test Edit'),
                (25, 105, 2, '2021-01-14 00:49:00', 'Test Edit 2'),
                (26, 105, 3, '2021-01-14 00:49:00', 'Test Edit 3'),
                (27, 105, 4, '2021-01-14 00:49:00', 'Test Edit 4'),
                (28, 105, 5, '2021-01-14 00:49:00', 'Test Edit 5'),
                (29, 105, 6, '2021-01-14 00:49:00', 'Test Edit 6'),
                (30, 105, 7, '2021-01-14 00:49:00', 'Test Edit 7'),
                (31, 105, 8, '2021-01-14 00:49:00', 'Test Edit 8'),
                (32, 105, 9, '2021-01-14 00:49:00', 'Test Edit 9'),
                (33, 105, 10, '2021-01-14 00:49:00', 'Test Edit 10'),
                (34, 105, 11, '2021-01-14 00:49:00', 'Test Edit 11')`).execute()
                    .catch(err => done(err));

                persistent.snipeData.time = moment().valueOf();
                persistent.snipeData.msgs = [105];
                await writeFile('./persistent.json', JSON.stringify(persistent, null, 2), (err) => {
                    if (err) done(err);
                });

                new testUtil.testChannel(guild, { name: "test", id: 333 });
            }

            const msg = testUtil.createMessage(channel);
            loadData().then(() => {
                snipe.testing.getEdits(msg, ['', '', 'all'], 1)
                    .then((complete) => {
                        assert(complete);
                        const msgContents = channel.lastMessage.content.split('\n');
                        assert.equal(msgContents[13], '[11] 2021-01-14 0:49:00 - Test Edit 11');
                        assert.equal(msgContents[14], '2021-01-14 01:05:00 - Test Message');
                        assert.equal(msgContents[15], 'Current');
                        done();
                    })
                    .catch(err => done(err));
            })
                .catch(err => done(err));
        });
    });

    describe('main', function () {
        const persistent = require('../persistent.json');
        const { writeFile } = require('fs');

        after(async () => {
            // sets persistent snipeData to default values
            persistent.snipeData.time = 0;
            persistent.snipeData.msgs = [];
            await writeFile('./persistent.json', JSON.stringify(persistent, null, 2), (err) => {
                if (err) throw err;
            })

            await db.buildQuery(`DELETE FROM messages WHERE channel_id = 333`).execute()
                .catch(err => { throw err });
            await db.buildQuery(`DELETE FROM edits WHERE length(id) = 3`).execute()
                .catch(err => { throw err })
        });

        it('gets deleted by mention', function (done) {
            async function loadData() {
                // loads test data
                // test data identified by messages.channel_id being 333
                await db.buildQuery(`INSERT INTO messages (id, user_id, channel_id, send_time, content)
                VALUES
                (200, ${member.id}, 333, '2021-01-15 01:10:00', 'Test Message')`).execute()
                    .catch(err => done(err));
            }
            const msg = testUtil.createMessage(channel, '.snipe', memberAuthor, { mentions: [member] });
            loadData().then(() => {
                snipe.main(msg, [])
                    .then((complete) => {
                        assert.equal(complete, true);
                        assert.equal(channel.lastMessage.content, `[1] 1/15 1:10:00 - Test Message`);
                        done();
                    })
                    .catch(err => done(err));
            })
                .catch(err => done(err));
        });

        it('gets deleted by ID', function (done) {
            async function loadData() {
                // loads test data
                // test data identified by messages.channel_id being 333
                await db.buildQuery(`INSERT INTO messages (id, user_id, channel_id, send_time, content)
                VALUES
                (201, ${member.id}, 333, '2021-01-16 11:56:00', 'Test Message')`).execute()
                    .catch(err => done(err));
            }

            const msg = testUtil.createMessage(channel, '.snipe', memberAuthor);
            loadData().then(() => {
                snipe.main(msg, [member.id])
                    .then((complete) => {
                        assert.equal(complete, true);
                        assert.equal(channel.lastMessage.content, `[1] 1/16 11:56:00 - Test Message`);
                        done();
                    })
                    .catch(err => done(err));
            })
                .catch(err => done(err));
        });

        it('gets edits', function (done) {
            async function loadData() {
                // loads test data
                // test data identified by messages.channel_id being 333
                await db.buildQuery(`INSERT INTO messages (id, user_id, channel_id, send_time, content)
                VALUES
                (202, ${member.id}, 333, '2021-01-16 11:44:00', 'Test Message')`).execute()
                    .catch(err => done(err));

                // test data identified by length of id = 3
                await db.buildQuery(`INSERT INTO edits (id, msg_id, num, edit_time, content)
                VALUES
                (100, 202, 1, '2021-01-16 11:42:00', 'Test Edit'),
                (101, 202, 2, '2021-01-16 11:43:00', 'Test Edit 2'),
                (102, 202, 3, '2021-01-16 11:43:30', 'Test Ping <@!${memberAuthor.id}>')`).execute()
                    .catch(err => done(err));

                persistent.snipeData.time = moment().valueOf();
                persistent.snipeData.msgs = [202];
                await writeFile('./persistent.json', JSON.stringify(persistent, null, 2), (err) => {
                    if (err) done(err);
                });

                new testUtil.testChannel(guild, { name: "test", id: 333 });
            }

            const msg = testUtil.createMessage(channel, '.snipe', memberAuthor);
            loadData().then(() => {
                snipe.main(msg, ['edits', '1'])
                    .then((complete) => {
                        assert(complete);
                        const msgContent = channel.lastMessage.content.split('\n');
                        assert.equal(msgContent[0], `Sent At:\t\t 2021-01-16 11:44:00\t\tAuthor:\t @${user.tag}`);
                        assert.equal(msgContent[1].substr(-16), "Channel:   #test");
                        assert.equal(msgContent[2], "Oldest");
                        assert.equal(msgContent[3], "[1] 2021-01-16 11:42:00 - Test Edit");
                        assert.equal(msgContent[4], "[2] 2021-01-16 11:43:00 - Test Edit 2");
                        assert.equal(msgContent[5], "[3] 2021-01-16 11:43:30 - Test Ping @test author#1234");
                        assert.equal(msgContent[6], "2021-01-16 11:44:00 - Test Message");
                        assert.equal(msgContent[7], "Current");
                        done();
                    })
                    .catch(err => done(err));
            })
                .catch(err => done(err));
        });

        it('returns on no member or ID', function (done) {
            const msg = testUtil.createMessage(channel, '.snipe', memberAuthor);
            snipe.main(msg, [])
                .then((complete) => {
                    assert.equal(complete, false);
                    assert.equal(channel.lastMessage.content, "No member or ID specified");
                    done();
                })
                .catch(err => done(err));
        });

        it('returns on not a number', function (done) {
            const msg = testUtil.createMessage(channel, '.snipe', memberAuthor);
            snipe.main(msg, ['edits', 'a'])
                .then((complete) => {
                    assert.equal(complete, false);
                    assert.equal(channel.lastMessage.content, "Argument provided is not a number");
                    done();
                })
                .catch(err => done(err));
        });

        it('checks everyone ping', function (done) {
            const msg = testUtil.createMessage(channel, '', memberAuthor, { mention_everyone: true });
            snipe.main(msg, ['edits'])
                .then((complete) => {
                    assert.equal(complete, false);
                    assert.equal(channel.lastMessage.content, "I can't snipe everyone");
                    done();
                })
                .catch(err => done(err));
        });

        it('checks author perm', function (done) {
            const msg = testUtil.createMessage(channel, '', member);
            snipe.main(msg, [])
                .then((complete) => {
                    assert.equal(complete, undefined);
                    assert.equal(channel.lastMessage, null);
                    done();
                })
                .catch(err => done(err));
        });
    });
});

describe('verify', function () {
    const verify = require('../commands/verify.js');
    let client = new Discord.Client();
    let guild = testUtil.createGuild(client);
    let channel = new testUtil.testChannel(guild);
    let user = testUtil.createUser(client, "test user", '1234');
    let member = testUtil.createMember(client, guild, user);
    let userAuthor = testUtil.createUser(client, "author user", '4321');
    let memberAuthor = testUtil.createMember(client, guild, user)
    let humanRole = testUtil.createRole(client, guild, { id: config.humanRoleID }).role;

    before(() => {
        util.testing.silenceLogging(true);
    });

    beforeEach(async () => {
        client.destroy();
        client = new Discord.Client();
        guild = testUtil.createGuild(client);
        channel = new testUtil.testChannel(guild);
        user = testUtil.createUser(client, "test user", '1234');
        member = testUtil.createMember(client, guild, user);
        userAuthor = testUtil.createUser(client, "author user", '4321');
        memberAuthor = testUtil.createMember(client, guild, user)
        const role = testUtil.createRole(client, guild, { id: config.adminRoleID }).role;
        await memberAuthor.roles.add(role);
        humanRole = testUtil.createRole(client, guild, { id: config.humanRoleID }).role;
    });

    after(() => {
        client.destroy();
        util.testing.silenceLogging(false);
    });

    it('verifies', function (done) {
        const msg = testUtil.createMessage(channel);
        verify.testing.verify(msg, member)
            .then((complete) => {
                assert.equal(complete, true);
                assert(member.roles.cache.has(config.humanRoleID));
                assert.equal(channel.lastMessage.content, "Member verified");
                done();
            })
            .catch(err => done(err));
    });

    it('returns on already verified', function (done) {
        member.roles.add(humanRole);
        const msg = testUtil.createMessage(channel);
        verify.testing.verify(msg, member)
            .then((complete) => {
                assert.equal(complete, false);
                assert(member.roles.cache.has(config.humanRoleID));
                assert.equal(channel.lastMessage.content, "Member already verified");
                done();
            })
            .catch(err => done(err));
    });

    it('verifies on mention', function (done) {
        const msg = testUtil.createMessage(channel, '', memberAuthor, { mentions: [member] });
        verify.main(msg, [])
            .then((complete) => {
                assert.equal(complete, true);
                assert(member.roles.cache.has(config.humanRoleID));
                assert.equal(channel.lastMessage.content, "Member verified");
                done();
            })
            .catch(err => done(err));
    });

    it('verifies on ID', function (done) {
        const msg = testUtil.createMessage(channel, '', memberAuthor);
        verify.main(msg, [`${member.id}`])
            .then((complete) => {
                assert.equal(complete, true);
                assert.equal(channel.lastMessage.content, "Member verified");
                assert(guild.members.cache.get(member.id).roles.cache.has(config.humanRoleID));
                done();
            })
            .catch(err => done(err));
    });

    it('returns on no member or ID', function (done) {
        const msg = testUtil.createMessage(channel, '', memberAuthor);
        verify.main(msg, [])
            .then((complete) => {
                assert.equal(complete, false);
                assert(!(member.roles.cache.has(config.humanRoleID)));
                assert.equal(channel.lastMessage.content, "No member or ID specified");
                done();
            })
            .catch(err => done(err));
    });

    it('returns on everyone ping', function (done) {
        const msg = testUtil.createMessage(channel, '', memberAuthor, { mention_everyone: true });
        verify.main(msg, [])
            .then((complete) => {
                assert.equal(complete, false);
                assert(!(member.roles.cache.has(config.humanRoleID)));
                assert.equal(channel.lastMessage.content, "I can't verify everyone");
                done();
            })
            .catch(err => done(err));
    });

    it('checks author perm', function (done) {
        const msg = testUtil.createMessage(channel, '', member);
        verify.main(msg, [])
            .then((complete) => {
                assert.equal(complete, undefined);
                assert(!(member.roles.cache.has(config.humanRoleID)));
                assert.equal(channel.lastMessage, null);
                done();
            })
            .catch(err => done(err));
    });
});