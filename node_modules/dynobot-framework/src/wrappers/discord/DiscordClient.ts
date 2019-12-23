import {IClient} from "../interfaces/IClient";
import {IUser} from "../interfaces/IUser";
import {DiscordUser} from "./DiscordUser";
import {IServer} from "../interfaces/IServer";
import {DiscordServer} from "./DiscordServer";

export class DiscordClient implements IClient {
	private readonly _user: IUser;
	private readonly _client: any;

	constructor(client: any) {
		this._user = new DiscordUser(client.user);
		this._client = client;
	}

	getUser(): IUser {
		return this._user;
	}

	getServers(): IServer[] {
		let servers: object[] = this._client.guilds.array();
		let wrappedServers: IServer[] = [];
		servers.forEach(server => {
			wrappedServers.push(new DiscordServer(server));
		});

		return wrappedServers;
	}
}