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
 * @param {Array<string>} roles an array of role ids to be added to the member
 * @param {string} nickname the nickname of the member
 * @param {Object} extraData extra data to be provided to the object
 * @returns {Discord.GuildMember}
 */
function createMember(client, guild, user, roles = [], nickname = undefined, extraData = {}) {
    const member = new classOverrides.TestMember(client, {user: user, roles: roles, nick: nickname, id: user.id, ...extraData}, guild);
    guild.members.add({ user: user, roles: roles, nick: nickname, id: user.id, ...extraData });
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

/**
 * Creates a message object for testing
 * @param {Discord.TextChannel} channel The channel the message is sent to
 * @param {string} [content] The content of the message
 * @param {Discord.GuildMember|Discord.User} [author] The user or guildmember that sent the message
 * @param {Object} [extraData] Extra data to be passed to the message object
 * @param {Discord.Snowflake} [extraData.id] The id of the message, will be generated if undefined
 * @param {Array<Discord.GuildMember|Discord.User>} [extraData.mentions] Array of mentions in the message
 * @param {boolean} [extraData.mention_everyone] Boolean if everyone is mentioned
 * @returns {TestMessage}
 */
function createMessage(channel, content, author, extraData = {}) {
    let data = {content: content, ...extraData};
    if (!('id' in data)) {
        const id = Discord.SnowflakeUtil.generate();
        data = { id: id, ...data };
    }
    if (!('mentions' in data)) data = { mentions: [], ...data };
    if (!('mention_everyone' in data)) data = { mention_everyone: false, ...data };

    if (author instanceof Discord.GuildMember || author instanceof classOverrides.TestMember) {
        const memberData = { nick: author.nickname, joined_at: author.joinedTimestamp, premium_since: author.premiumSinceTimestamp, user: author.user, roles: author._roles };
        data = { author: author.user, member: memberData, ...data };
    } else if (author instanceof Discord.User) {
        data = { author: author, ...data };
    }

    return new classOverrides.TestMessage(channel.client, data, channel);
}

exports.createUser = createUser;
exports.createMember = createMember;
exports.createRole = createRole;
exports.createGuild = createGuild;
exports.testChannel = classOverrides.TestChannel;
exports.createMessage = createMessage;