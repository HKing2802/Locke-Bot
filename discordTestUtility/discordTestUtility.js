const Discord = require('discord.js');
const classOverrides = require('./testClassOverrides.js');

/**
 * Creates a Discord User object
 * @param {Discord.Client} client The instantiating client
 * @param {string} username The username of the user
 * @param {string} discriminator The 4 digit discriminator for the user
 * @param {boolean} bot Flag if the user is a bot
 * @param {Object} extraData extra data to be provided to the object
 */
function createUser(client, username, discriminator, bot = false, extraData = {}) {
    let data;
    if (extraData.id) {
        data = { username: username, discriminator: discriminator, bot: bot, ...extraData };
    } else {
        const id = Discord.SnowflakeUtil.generate();
        data = { username: username, discriminator: discriminator, bot: bot, id: id, ...extraData };
    }
    const user = new Discord.User(client, data);
    client.users.add(user);
    return user;
}

// roles - array of role ids
/**
 * Creates a Discord GuildMember object
 * @param {Discord.Client} client The instantiating client
 * @param {Discord.Guild} guild The guild the member belongs to
 * @param {Discord.User} user the user the member is based off of
 * @param {Array} roles an array of role ids to be added to the member
 * @param {string} nickname the nickname of the member
 * @param {Object} extraData extra data to be provided to the object
 * @returns {Discord.GuildMember}
 */
function createMember(client, guild, user, roles = [], nickname = undefined, extraData = {}) {
    const member = new classOverrides.TestMember(client, {user: user, roles: roles, nick: nickname, id: user.id, ...extraData}, guild);
    guild.members.add(member);
    return member;
}

/**
 * Creates a Discord Role object and adds it to the provided guild
 * @param {Discord.Client} client the instantiating client
 * @param {Discord.Guild} guild the guild the role belongs to
 * @param {Object} extraData extra data to be provided to the object
 */
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

/**
 * Creates a Discord Guild with an @everyone role
 * @param {Discord.Client} client - the instantiating client
 * @param {import('discord.js').Snowflake} id - the id for the server
 * @param {Object} extraData - Extra Data to be passed to the guild object
 * @returns {Discord.Guild}
 */
function createGuild(client, id, extraData = {}) {
    if (typeof id === 'undefined') {
        id = Discord.SnowflakeUtil.generate();
    }
    const guild = new classOverrides.TestGuild(client, { id: id, ...extraData });
    const role = new Discord.Role(client, { id: id, name: "everyone" }, guild);
    guild.roles.add(role);
    client.guilds.add({ id: id, roles: [{ id: id, name: "everyone" }], ...extraData })
    return guild;
}

exports.createUser = createUser;
exports.createMember = createMember;
exports.createRole = createRole;
exports.createGuild = createGuild;
exports.testChannel = classOverrides.TestChannel;

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