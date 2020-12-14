const Discord = require('discord.js');

/**
 * Testing Message Manager for adding a function to fetch messages without Discord API calls
 * @extends {Discord.MessageManager}
 * @class
 */
class TestMessageManager extends Discord.MessageManager {
    /**
     * Gets a message from this channel
     * @param {Snowflake} id - The Id of the message to fetch
     */
    fetchIdCache(id) {
        return this.cache.get(id);
    }
}

/**
 * Testing channel for the Discord Text Channel class
 * @extends {Discord.TextChannel}
 * @class
 */
class TestChannel extends Discord.TextChannel {
    /**
     * @param {Discord.Guild} Guild The guild the text channel is part of
     */
    constructor(Guild) {
        super(Guild, { type: 0 });

        this.testMessages = new TestMessageManager(this);
    }

    /**
     * Sends a message in the test channel
     * @param {string} content - Message content
     * @param {Discord.User} [authorUser] - Author of the message as a user
     * @param {Discord.GuildMember} [authorMember] - Author of the message as a GuildMember
     * @param {string[]} [mentions=[]] - Array of string names for mentions in the message
     * @param {Object} [extraData={}] - Object of any additional extra data
     * @param {boolean} [pingEveryone=false] - Boolean if there is an everyone ping in the message
     * @returns {Promise<Discord.Message>}
     */
    async send(content, authorUser, authorMember, mentions = [], extraData = {}, pingEveryone = false) {
        const id = Discord.SnowflakeUtil.generate()
        let data;
        if (mentions == []) {
            data = { id: id, content: content, author: authorUser, member: authorMember, mention_everyone: pingEveryone, ...extraData };
        } else {
            let mentionsArray = [];
            for (const name of mentions) {
                const kvpair = [Discord.SnowflakeUtil.generate(), name];
                mentionsArray.push(kvpair);
            }
            const mentionsCollection = new Discord.Collection(mentionsArray);
            data = { id: id, content: content, author: authorUser, member: authorMember, mentions: mentionsCollection, mention_everyone: pingEveryone, ...extraData };
        }
        this.testMessages.add(data, this);
        this.lastMessageID = id;
        return this.testMessages.fetchIdCache(id);
    }

    /**
     * Gets a message sent in the test channel
     * @param {import('discord.js').Snowflake} id - ID of the message
     * @returns {Discord.Message}
     */
    getMessage(id) {
        return this.testMessages.fetchIdCache(id);
    }
}

class TestMember extends Discord.GuildMember {
    /**
     * Kicks a member from the guild
     * @param {string} [reason] - Reason for kicking the user
     * @returns {Promise<GuildMember>}
     */
    async kick(reason) {
        if (!this.id) return Promise.reject(new Error('NO_ID'));
        this.guild.members.cache.delete(this.id)
        return this;
    }

    /**
     * Bans the member from the guild
   * @param {Object} [options] Options for the ban
   * @param {number} [options.days=0] Number of days of messages to delete
   * @param {string} [options.reason] Reason for banning
   * @returns {Promise<GuildMember>}
     */
    ban(options) {
        if (!(this.guild instanceof TestGuild)) return Promise.reject(new Error('BAD_GUILD_SETUP'));
        return this.guild.members.ban(this, options);
    }
}

/**
 * Helper class for the Test Guild
 * @extends {Discord.GuildMemberManager}
 * @class
 */
class TestGuildMemberManager extends Discord.GuildMemberManager {
    constructor(guild, iterable) {
        super(guild, iterable)

        this.bans = new Map();
    }

    /**
     * Bans a user in the test guild
     * @param {Discord.UserResolvable} user - The user to ban
     * @param {Object} options - Options for the ban
     * @param {number} [options.days=0] Number of days of messages to delete
     * @param {string} [options.reason] Reason for banning
     * @returns {Promise<GuildMember|User|Snowflake>} Result object will be resolved as specifically as possible.
     * If the GuildMember cannot be resolved, the User will instead be attempted to be resolved. If that also cannot
     * be resolved, the user ID will be the result.
     */
    async ban(user, options = { days: 0 }) {
        const id = this.client.users.resolveID(user);
        if (!id) return Promise.reject(new Error('BAN_RESOLVE_ID', true));
        this.bans.set(id, options);
        this.cache.delete(id);
        if (user instanceof Discord.GuildMember) return user;
        const _user = this.client.users.resolve(id);
        if (_user) {
            const member = this.resolve(_user);
            return member || _user;
        }
        return id;
    }

    /**
     * Unbans a user from the test guild
     * @param {Discord.UserResolvable} user - The user to unban
     * @param {string} [reason] - Reason for unbanning user
     * @returns {Promise<user>}
     */
    async unban(user, reason) {
        const id = this.client.users.resolveID(user);
        if (!id) return Promise.reject(new Error('BAN_RESOLVE_ID'));
        this.bans.delete(id);
        return this.client.users.resolve(user)
    }

    _fetchSingle({ user, cache }) {
        return this.cache.get(user);
    }
}

/**
 * Testing Guild for testing actions called on guilds or on guild members
 * @extends {Discord.Guild}
 * @class
 */
class TestGuild extends Discord.Guild {
    /**
     * @param {Discord.client} client - client that created the guild
     * @param {Object} data - extra data for the guild
     */
    constructor(client, data) {
        super(client, data);

        this.testMembers = new TestGuildMemberManager(this);
    }

    /**
     * Gets the member manager for the test guild
     * @returns {TestGuildMemberManager}
     */
    get members() {
        return this.testMembers;
    }

    set members(m) {}
}

exports.TestChannel = TestChannel;
exports.TestGuild = TestGuild;
exports.TestMember = TestMember;
