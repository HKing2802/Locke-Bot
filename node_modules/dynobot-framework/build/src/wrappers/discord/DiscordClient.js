"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DiscordUser_1 = require("./DiscordUser");
const DiscordServer_1 = require("./DiscordServer");
class DiscordClient {
    constructor(client) {
        this._user = new DiscordUser_1.DiscordUser(client.user);
        this._client = client;
    }
    getUser() {
        return this._user;
    }
    getServers() {
        let servers = this._client.guilds.array();
        let wrappedServers = [];
        servers.forEach(server => {
            wrappedServers.push(new DiscordServer_1.DiscordServer(server));
        });
        return wrappedServers;
    }
}
exports.DiscordClient = DiscordClient;
//# sourceMappingURL=DiscordClient.js.map