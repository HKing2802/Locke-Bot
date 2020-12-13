const Discord = require('discord.js');
const classOverrides = require('./testClassOverrides.js');

function captureStream(stream) {
    var oldWrite = stream.write;
    var buf = '';
    stream.write = function (chunk, encoding, callback) {
        buf += chunk.toString();
        oldWrite.apply(stream, arguments);
    }

    return {
        unhook: function unhook() {
            stream.write = oldWrite;
        },
        captured: function () {
            return buf;
        }
    };
}

function createUser(client, username, discriminator, bot = false, extraData = {}) {
    let data;
    if (extraData.id) {
        data = { username: username, discriminator: discriminator, bot: bot, ...extraData };
    } else {
        const id = Discord.SnowflakeUtil.generate();
        data = { username: username, discriminator: discriminator, bot: bot, id: id, ...extraData };
    }
    return new Discord.User(client, data);
}

// roles - array of role ids
function createMember(client, guild, user, roles = [], nickname = undefined, extraData = {}) {
    const member = new classOverrides.TestMember(client, {user: user, roles: roles, nick: nickname, id: user.id, ...extraData}, guild);
    guild.members.add(member);
    return member;
}

function createRole(client, guild, extraData = {}) {
    if (extraData.id && extraData.position) {
        const id = extraData.id;
        const role = new Discord.Role(client, { ...extraData }, guild);
        guild.roles.add(role);
        return { id, role };
    } else if (extraData.id) {
        const id = extraData.id;
        const role = new Discord.Role(client, { position: -1, ...extraData }, guild);
        guild.roles.add(role);
        return { id, role };
    } else if (extraData.position) {
        const id = Discord.SnowflakeUtil.generate();
        const role = new Discord.Role(client, { id: id, ...extraData }, guild);
        guild.roles.add(role);
        return { id, role };
    } else {
        const id = Discord.SnowflakeUtil.generate();
        const role = new Discord.Role(client, { id: id, position: -1, ...extraData }, guild);
        guild.roles.add(role);
        return { id,  role };
    }
}

function createGuild(client, id) {
    if (typeof id === 'undefined') {
        id = Discord.SnowflakeUtil.generate();
    }
    const guild = new classOverrides.TestGuild(client, { id: id });
    const role = new Discord.Role(client, { id: id, name: "everyone" }, guild);
    guild.roles.add(role);
    return guild;
}

exports.captureStream = captureStream;
exports.createUser = createUser;
exports.createMember = createMember;
exports.createRole = createRole;
exports.createGuild = createGuild;


/* all require message
 * 
 * channel = TextChannel
 * guild = Guild
 * member = GuildMember
 * author = User
 * client = Client
 * 
 * ping
 *  channel
 *  guild
 *  
 * endprocess
 *  client
 *  
 * shutdown
 *  none
 *  
 * startup
 *  none
 *  
 * mute
 *  member
 *  author
 *  channel
 *  guild
 *  
 * unmute
 *  member
 *  author
 *  channel
 *  guild
 *  
 * help
 *  channel
 *  
 * snipe
 *  author
 *  member
 *  channel
 *  
 * verify
 *  author
 *  member
 *  guild
 *  
 * kick
 *  author
 *  member
 *  guild
 *  channel
 *  
 * ban
 *  author
 *  member
 *  guild
 *  channel
 *  
 * reactKae
 *  author
 *  
*/