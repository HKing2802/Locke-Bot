"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DiscordChannel_1 = require("./DiscordChannel");
const DiscordUser_1 = require("./DiscordUser");
const DiscordRole_1 = require("./DiscordRole");
const DiscordServer_1 = require("./DiscordServer");
const ErrorHandler_1 = require("../../utils/ErrorHandler");
class DiscordMessage {
    constructor(message) {
        this._message = message;
    }
    getChannel() {
        return new DiscordChannel_1.DiscordChannel(this._message.channel);
    }
    getContent(excludeFirstWord) {
        if (excludeFirstWord) {
            let content = this._message.content;
            let index = content.indexOf(" ");
            return content.slice(index + 1, content.length);
        }
        else {
            return this._message.content;
        }
    }
    getContentArray(excludeFirstWord) {
        let messageArray = this._message.content.split(" ");
        if (excludeFirstWord) {
            messageArray.shift();
            return messageArray;
        }
        else {
            return messageArray;
        }
    }
    getRegexGroups(RegexPattern) {
        return RegexPattern.exec(this._message.content);
    }
    getAuthor() {
        return new DiscordUser_1.DiscordUser(this._message.author);
    }
    getAuthorRoles() {
        if (this._message.member && this._message.member.roles) {
            let roles = this._message.member.roles.array(), Roles = [];
            roles.forEach(role => {
                Roles.push(new DiscordRole_1.DiscordRole(role));
            });
            return Roles;
        }
        else {
            return [];
        }
    }
    hasServer() {
        return !!this._message.guild;
    }
    getServer() {
        if (this._message.guild) {
            return new DiscordServer_1.DiscordServer(this._message.guild);
        }
        else {
            ErrorHandler_1.ErrorHandler.throwErrorMessage("The message was not sent on a server.");
        }
    }
    isMentioned(User) {
        let mentionedUsers = this._message.mentions.users, mentioned = false;
        mentionedUsers.forEach(user => {
            if (User.getId() === user.id) {
                mentioned = true;
            }
        });
        return mentioned;
    }
    isDeletable() {
        return this._message.deletable;
    }
    delete() {
        return new Promise((resolve, reject) => {
            this._message.delete().then(message => {
                resolve(new DiscordMessage(message));
            }).catch(error => {
                reject(error);
            });
        });
    }
    getCreationDate() {
        return this._message.createdAt;
    }
}
exports.DiscordMessage = DiscordMessage;
//# sourceMappingURL=DiscordMessage.js.map