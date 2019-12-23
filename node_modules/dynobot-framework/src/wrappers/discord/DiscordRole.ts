import {IRole} from "../interfaces/IRole";

export class DiscordRole implements IRole {
	private _role: any;

	constructor(role) {
		this._role = role;
	}

	getId(): number {
		return this._role.id;
	}

	getName(): string {
		return this._role.name;
	}

	getColor(): number {
		return this._role.color;
	}

	getPermissions(): number {
		return this._role.permissions;
	}
}