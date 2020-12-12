const Discord = require('discord.js');

class testChannel extends Discord.TextChannel {
    constructor(Guild) {
        super(Guild, { type: 0 });
    }

    // mentions - array of string names
    // content - string
    // author - member
    // id - snowflake created in method and returned
    send(content, authorUser, authorMember, mentions = [], extraData = {}, pingEveryone = false) {
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
        this._messages.add(data, this);
        this.lastMessageID = id;
        return id;
    }

    getMessage(id) {
        return this._messages.fetchIdCache(id);
    }
}

exports.testChannel = testChannel;

