const assert = require('assert');
const testUtil = require('../discordTestUtility/discordTestUtility.js');
const util = require('../util.js');
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
    it('returns a map', function () {
        const channelMap = util.getLogChannels([["123", "456"]]);

        assert(channelMap instanceof Map);
    });

    it('returns ids mapped correctly', function () {
        const channelMap = util.getLogChannels([["123", "456"], ["987", "654"]])

        assert(channelMap instanceof Map);
        assert.equal(channelMap.get("123"), "456");
        assert.equal(channelMap.get("987"), "654");
    });


});

describe('log', function () {

});