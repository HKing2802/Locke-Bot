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
    fetch(id) {
        return this.cache.get(id);
    }

    add(data, cache = true) {
        const existing = this.cache.get(data.id);
        if (existing && existing._patch && cache) existing._patch(data);
        if (existing) return existing;

        const entry = new TestMessage(this.client, data, this.channel);
        if (cache) this.cache.set(entry.id, entry);
        return entry;
    }

    /**
     * deletes a message from the cache
     * @param {import('discord.js').MessageResolvable} message The message to delete
     * @param {string} reason Reason for deleting this message, if it does not belong to the client user
     * @returns {Promise<void>}
     */
    async delete(message, reason) {
        message = this.resolveID(message);
        if (message) this.cache.delete(message);
    }
}

/**
 * Override of the MessageMentions class to fix problem with testing
 * @extends {Discord.MessageMentions}
 * @class
 */
class TestMessageMentions extends Discord.MessageMentions {
    constructor(message, users, members, roles, everyone, crosspostedChannels) {
        super(message, users, roles, everyone, crosspostedChannels);


        if (members) {
            this.member_collection = new Discord.Collection();
            for (const mention of members) {
                this.member_collection.set(mention.id, mention);
            }
        }
    }

    get members() {
        if (!this.guild) return null;
        return this.member_collection;
    }
}

/**
 * Override of the Message class to better instantiate message mentions for testing
 * @extends {Discord.Message}
 * @class
 */
class TestMessage extends Discord.Message {
    constructor(client, data, channel) {
        super(client, data, channel);

        if (data.mentions) {
            let mentionUser = [];
            let mentionMember = [];
            for (const mention of data.mentions) {
                if (mention instanceof Discord.User) mentionUser.push(mention);
                if (mention instanceof Discord.GuildMember) {
                    mentionMember.push(mention);
                    mentionUser.push(mention.user);
                }
            }
            this.mentions = new TestMessageMentions(this, mentionUser, mentionMember, data.mention_roles, data.mention_everyone, data.mention_channels);
        } else {
            this.mentions = new TestMessageMentions(this, data.mentions, data.mention_roles, data.mention_everyone, data.mention_channels);
        }
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
     * @param {Object} [extraData] Extra data to be passed to the constructor
     */
    constructor(Guild, extraData = {}) {
        let data;
        if (extraData.id) {
            data = { type: 0, ...extraData };
        } else {
            const id = Discord.SnowflakeUtil.generate();
            data = { type: 0, id: id, ...extraData };
        }
        super(Guild, data);

        //Guild.client.channels.add(data, Guild);
        Guild.channels.cache.set(this.id, this);
        Guild.client.guilds.cache.set(Guild.id, Guild)

        this.testMessages = new TestMessageManager(this);
    }

    /**
     * Sends a message in the test channel
     * @param {string} content - Message content
     * @param {Discord.User} [authorUser] - Author of the message as a user
     * @param {Discord.GuildMember} [authorMember] - Author of the message as a GuildMember
     * @param {Array<Discord.User>} [mentions] - Array of User objects for mentions in the message
     * @param {Object} [extraData] - Object of any additional extra data
     * @param {boolean} [pingEveryone=false] - Boolean if there is an everyone ping in the message
     * @returns {Promise<Discord.Message>}
     */
    async send(content, authorUser, authorMember, mentions = [], extraData = {}, pingEveryone = false) {
        const id = Discord.SnowflakeUtil.generate()
        let data = { id: id, content: content, mentions: mentions, mention_everyone: pingEveryone, ...extraData };
        if (authorUser) data = { author: authorUser, ...data };
        if (authorMember) {
            const authorMemberData = { nick: authorMember.nickname, joined_at: authorMember.joinedTimestamp, premium_since: authorMember.premiumSinceTimestamp, user: authorMember.user, roles: authorMember._roles }
            data = { member: authorMemberData, ...data };
        }
        this.testMessages.add(data, this);
        this.lastMessageID = this.messages.fetch(id).id;
        return this.messages.fetch(id);
    }

    /**
     * Gets a message sent in the test channel
     * @param {import('discord.js').Snowflake} id - ID of the message
     * @returns {Discord.Message}
     */
    get messages() {
        return this.testMessages;
    }

    set messages(m) { }
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
        return this.guild.members.ban(this.id, options);
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
     * Overrdies the BaseManager add to use TestMember objects instead of GuildMember
     * @param {Object} data The data passed to TestMember creation
     * @param {boolean} cache If the newly created member will be added to the guild's cache
     * @returns {TestMember}
     */
    add(data, cache = true) {
        const existing = this.cache.get(data.id);
        if (existing && existing._patch && cache) existing._patch(data);
        if (existing) return existing;

        const entry = new TestMember(this.client, data, this.guild);
        if (cache) this.cache.set(entry.id, entry);
        return entry;
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
        let id = this.client.users.resolveID(user);
        if (!id) id = this.guild.members.resolveID(user);
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
        let id = this.client.users.resolveID(user);
        if (!id) id = user.id;
        if (!id) return Promise.reject(new Error('UNBAN_RESOLVE_ID'));
        this.bans.delete(id);
        return this.client.users.resolve(id)
    }

    fetchBan(user) {
        let id = this.client.users.resolveID(user);
        if (!id) id = user.id;
        if (!id) throw new Error('FETCH_BAN_RESOLVE_ID');
        return this.bans.get(id);
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
exports.TestMessage = TestMessage;