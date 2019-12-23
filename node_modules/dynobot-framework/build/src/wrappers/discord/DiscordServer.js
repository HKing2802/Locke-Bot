"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DiscordUser_1 = require("./DiscordUser");
const DiscordChannel_1 = require("./DiscordChannel");
const DiscordRole_1 = require("./DiscordRole");
class DiscordServer {
    constructor(server) {
        this._server = server;
    }
    getId() {
        return this._server.id;
    }
    getName() {
        return this._server.name;
    }
    getMembers() {
        let members = this._server.members.array(), Members = [];
        members.forEach(member => {
            Members.push(new DiscordUser_1.DiscordUser(member.user));
        });
        return Members;
    }
    getChannels() {
        let channels = this._server.channels.array(), Channels = [];
        channels.forEach(channel => {
            Channels.push(new DiscordChannel_1.DiscordChannel(channel));
        });
        return Channels;
    }
    hasChannel(channelId) {
        let i = 0, channels = this._server.channels.array();
        while (i < channels.length) {
            if (channels[i].id === channelId) {
                return new DiscordChannel_1.DiscordChannel(channels[i]);
            }
            i++;
        }
        return false;
    }
    getRoles() {
        let roles = this._server.roles.array(), Roles = [];
        roles.forEach(role => {
            Roles.push(new DiscordRole_1.DiscordRole(role));
        });
        return Roles;
    }
}
exports.DiscordServer = DiscordServer;
//# sourceMappingURL=DiscordServer.js.map