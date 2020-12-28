const assert = require('assert');
const testUtil = require('../discordTestUtility/discordTestUtility.js');
const util = require('../src/util.js');
const Discord = require('discord.js');
const config = require('../config.json');

describe('getPerm', function () {
    const client = new Discord.Client();
    const guild = testUtil.createGuild(client, undefined, { owner_id: "12" });
    const modrole = testUtil.createRole(client, guild, { id: config.modRoleID });
    const dadminrole = testUtil.createRole(client, guild, { id: config.dadminRoleID });
    const adminrole = testUtil.createRole(client, guild, { id: config.adminRoleID });
    const helperrole = testUtil.createRole(client, guild, { id: config.helperRoleID });
    const baseUser = testUtil.createUser(client, "test", "1234");

    it('passes moderator', function () {
        const member = testUtil.createMember(client, guild, baseUser, [modrole.id]);

        assert(util.getPerm(member));
    })

    it('passes dadmin', function () {
        const member = testUtil.createMember(client, guild, baseUser, [dadminrole.id]);

        assert(util.getPerm(member));
    })

    it('passes admin', function () {
        const member = testUtil.createMember(client, guild, baseUser, [adminrole.id]);

        assert(util.getPerm(member));
    })

    it('passes helper with param', function () {
        const member = testUtil.createMember(client, guild, baseUser, [helperrole.id]);

        assert(util.getPerm(member, true));
    })

    it('fails helper without param', function () {
        const member = testUtil.createMember(client, guild, baseUser, [helperrole.id]);

        assert.equal(util.getPerm(member), false);
    })

    it('fails otherwise', function () {
        const member = testUtil.createMember(client, guild, baseUser);

        assert.equal(util.getPerm(member), false);
    })

    client.destroy();
});

describe('getReason', function () {
    const client = new Discord.Client();
    let guild;
    let user;
    let member;

    beforeEach(() => {
        guild = testUtil.createGuild(client);
        user = testUtil.createUser(client, "test", "1234");
        member = testUtil.createMember(client, guild, user);
    });

    after(() => {
        client.destroy();
    })

    it('gets the reason', function () {
        const args = [`<@!${member.id}>`, "This", "is", "a", "test", "ban"];
        const reason = util.getReason(args, member);

        assert.equal(reason, "This is a test ban");
    });

    it('removes the tag', function () {
        const args = [`<@!${member.id}>This`, "is", "another", "test", "ban!"];
        const reason = util.getReason(args, member);

        assert.equal(reason, "This is another test ban!");
    });

    it('removes ID', function () {
        const args = [`${member.id}This`, "is", "a", "third", "ban!"];
        const reason = util.getReason(args, member);

        assert.equal(reason, "This is a third ban!");
    });
});

describe('filter attachment', function () {
    const path = "../config.json";
    const client = new Discord.Client();
    const guild = testUtil.createGuild(client);
    const channel = new testUtil.testChannel(guild);
    const user = testUtil.createUser(client, "test", "1234");

    it('catches file', function (done) {
        channel.send('', user, undefined, [], { attachments: [{ id: "12", url: path, filename: 'file.cmd' }] })
            .then((m) => {
                util.filterAttachment(m)
                    .then((deleted) => {
                        assert(deleted);
                        done();
                    })
                    .catch(err => done(err))
            })
            .catch(err => done(err));
    });

    it('deletes message', function (done) {
        channel.send('', user, undefined, [], { attachments: [{ id: "12", url: path, filename: 'file.exe' }] })
            .then((m) => {
                util.filterAttachment(m)
                    .then((deleted) => {
                        assert(deleted);
                        assert.equal(channel.messages.fetch(m.id), undefined);
                        done();
                    })
                    .catch(err => done(err));
            })
            .catch(err => done(err));
    });

    it('responds with message', function (done) {
        channel.send('test attachment message', user, undefined, [], { attachments: [{ id: "12", url: path, filename: 'file.bat' }] })
            .then((m) => {
                util.filterAttachment(m)
                    .then((deleted) => {
                        assert(deleted)
                        assert.equal(channel.lastMessage.content, "Sorry test#1234, I deleted that file because it's file-type is blacklisted in our spam filter");
                        done();
                    })
                    .catch(err => done(err));
            })
            .catch(err => done(err));
    });

    client.destroy();
});

describe('get log channels', function () {
    it('returns an array', function () {
        const channelMap = util.testing.checkLogChannels([["123", "456"]]);

        assert(Array.isArray(channelMap));
    });

    it('errors on bad parameter type', function () {
        const channelMap = util.testing.checkLogChannels("test");

        assert.equal(channelMap, "Logging channel not set up properly, parameter is of type string");
    });

    it('errors on empty array', function () {
        const channelMap = util.testing.checkLogChannels([]);

        assert.equal(channelMap, "Logging channel Array is empty");
    });

    it('errors on non-nested array', function () {
        const channelMap = util.testing.checkLogChannels(["123", "456"]);

        assert.equal(channelMap, "Logging channel not set up properly, array is of type string");
    });
});

describe('log', function () {
    const client = new Discord.Client();
    const guild = testUtil.createGuild(client, undefined, { name: "test guild" });
    const channel1 = new testUtil.testChannel(guild);
    const channel2 = new testUtil.testChannel(guild);

    const winston = require('winston');
    const SpyTransport = require('@chrisalderson/winston-spy');
    let logger;
    let transport;

    beforeEach(() => {
        transport = new winston.transports.SpyTransport();
        logger = winston.createLogger({
            level: 'info',
            transports: [
                new winston.transports.Console({ silent: true }),
                transport
            ]
        })
    });

    after(() => {
        client.destroy();
    })

    it('logs info to console', function (done) {
        util.log("test", undefined, false, 'info', undefined, logger)
            .then(() => {
                assert(transport.spy.calledOnce);
                assert(transport.spy.calledWithExactly({ message: "test", level: "info" }));
                done();
            })
            .catch(err => done(err));
    });

    it('logs error to console', function (done) {
        util.log("test 2", undefined, false, 'error', undefined, logger)
            .then(() => {
                assert(transport.spy.calledOnce);
                assert(transport.spy.calledWithExactly({ message: "test 2", level: "error" }));
                done();
            })
            .catch(err => done(err));
    });

    it('logs to channels', function (done) {
        const channels = [[guild.id, channel1.id], [guild.id, channel2.id]];

        util.log("channel test", client, true, "warn", channels, logger)
            .then((msg) => {
                assert(transport.spy.calledOnce);
                assert(transport.spy.calledWithExactly({ message: "channel test", level: "warn" }));
                assert.equal(channel1.messages.fetch(msg[0].id).content, "channel test");
                assert.equal(channel2.messages.fetch(msg[1].id).content, "channel test");
                done()
            })
            .catch(err => done(err));
    });

    it('warns on bad guild id', function (done) {
        const channels = [["12", channel1.id]];

        util.log("channel test", client, true, "info", channels, logger)
            .then((msg) => {
                assert(transport.spy.calledTwice);
                assert(transport.spy.calledWithExactly({ message: "channel test", level: "info" }));
                assert(transport.spy.calledWithExactly({ message: `Could not load guild for ID 12 and channel ID ${channel1.id}`, level: "warn" }));
                assert.equal(msg[0], undefined);
                done();
            })
            .catch(err => done(err));
    });

    it('warns on bad channel id', function (done) {
        const channels = [[guild.id, "1"]]
        util.log("channel test", client, true, "info", channels, logger)
            .then((msg) => {
                assert(transport.spy.calledTwice);
                assert(transport.spy.calledWithExactly({ message: "channel test", level: "info" }));
                assert(transport.spy.calledWithExactly({ message: `Could not load channel for ID 1 in guild ${guild.name}`, level: "warn" }));
                assert.equal(msg[0], undefined);
                done();
            })
            .catch(err => done(err));
    });

    it('continues when bad guild id given', function (done) {
        const channels = [["1", channel1.id], [guild.id, channel2.id]];
        util.log("Continue test", client, true, "info", channels, logger)
            .then((msg) => {
                assert(transport.spy.calledTwice);
                assert(transport.spy.calledWithExactly({ message: `Could not load guild for ID 1 and channel ID ${channel1.id}`, level: "warn" }));
                assert.equal(msg[0], undefined);
                assert.equal(msg[1].content, "Continue test");
                assert.equal(channel2.lastMessage.content, "Continue test");
                done();
            })
            .catch(err => done(err));
    });

    it('continues when bad channel id given', function (done) {
        const channels = [[guild.id, "1"], [guild.id, channel2.id]];
        util.log("Continue test 2", client, true, "info", channels, logger)
            .then((msg) => {
                assert(transport.spy.calledTwice);
                assert(transport.spy.calledWithExactly({ message: `Could not load channel for ID 1 in guild ${guild.name}`, level: "warn" }));
                assert.equal(msg[0], undefined);
                assert.equal(msg[1].content, "Continue test 2");
                assert.equal(channel2.lastMessage.content, "Continue test 2");
                done();
            })
            .catch(err => done(err));
    });

    it('skips embeds', function (done) {
        const channels = [[guild.id, channel1.id], [guild.id, channel2.id]];
        const embed = new Discord.MessageEmbed().setAuthor("LockeBot Test").setTitle("Test Embed");
        util.log(embed, client, true, "info", channels, logger)
            .then((msg) => {
                assert.equal(transport.spy.callCount, 0);
                assert(channel1.lastMessage.content instanceof Discord.MessageEmbed);
                assert(channel2.lastMessage.content instanceof Discord.MessageEmbed);
                assert.equal(channel1.lastMessage.content.title, "Test Embed");
                assert.equal(channel2.lastMessage.content.title, "Test Embed");
                done();
            })
            .catch(err => done(err));
    });
});