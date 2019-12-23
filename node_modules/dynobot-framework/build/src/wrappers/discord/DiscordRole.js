"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DiscordRole {
    constructor(role) {
        this._role = role;
    }
    getId() {
        return this._role.id;
    }
    getName() {
        return this._role.name;
    }
    getColor() {
        return this._role.color;
    }
    getPermissions() {
        return this._role.permissions;
    }
}
exports.DiscordRole = DiscordRole;
//# sourceMappingURL=DiscordRole.js.map