import {IServer} from "../interfaces/IServer";
import {IUser} from "../interfaces/IUser";
import {DiscordUser} from "./DiscordUser";
import {IChannel} from "../interfaces/IChannel";
import {DiscordChannel} from "./DiscordChannel";
import {IRole} from "../interfaces/IRole";
import {DiscordRole} from "./DiscordRole";

export class DiscordServer implements IServer {
	private _server: any;

	constructor(server) {
		this._server = server;
	}

	getId(): number {
		return this._server.id;
	}

	getName(): string {
		return this._server.name;
	}

	getMembers(): IUser[] {
		let members = this._server.members.array(),
			Members: IUser[] = [];

		members.forEach(member => {
			Members.push(new DiscordUser(member.user));
		});

		return Members;
	}

	getChannels(): IChannel[] {
		let channels = this._server.channels.array(),
			Channels: IChannel[] = [];

		channels.forEach(channel => {
			Channels.push(new DiscordChannel(channel));
		});

		return Channels;
	}

	hasChannel(channelId: string): IChannel|boolean {
		let i: number = 0,
			channels = this._server.channels.array();

		while(i < channels.length) {
			if (channels[i].id === channelId) {
				return new DiscordChannel(channels[i]);
			}
			i++;
		}

		return false;
	}

	getRoles(): IRole[] {
		let roles = this._server.roles.array(),
			Roles: IRole[] = [];

		roles.forEach(role => {
			Roles.push(new DiscordRole(role));
		});

		return Roles;
	}
}