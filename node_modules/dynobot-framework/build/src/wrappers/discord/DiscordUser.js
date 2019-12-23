"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DiscordChannel_1 = require("./DiscordChannel");
const DiscordServer_1 = require("./DiscordServer");
const ErrorHandler_1 = require("../../utils/ErrorHandler");
class DiscordUser {
    constructor(user) {
        this._user = user;
    }
    getId() {
        return this._user.id;
    }
    getName() {
        return this._user.username;
    }
    getTag() {
        return this._user.tag;
    }
    getServer() {
        if (this._user.guild) {
            return new DiscordServer_1.DiscordServer(this._user.guild);
        }
        else {
            ErrorHandler_1.ErrorHandler.log("The user is currently not acting on a server.");
            return null;
        }
    }
    createDM() {
        return new Promise((resolve, reject) => {
            this._user.createDM().then(channel => {
                resolve(new DiscordChannel_1.DiscordChannel(channel));
            }).catch(reason => {
                reject(reason);
            });
        });
    }
    deleteDM() {
        return new Promise((resolve, reject) => {
            this._user.deleteDM().then(channel => {
                resolve(new DiscordChannel_1.DiscordChannel(channel));
            }).catch(reason => {
                reject(reason);
            });
        });
    }
}
exports.DiscordUser = DiscordUser;
//# sourceMappingURL=DiscordUser.js.map