import {IBot} from "./interfaces/IBot";
import {IClient} from "./wrappers/interfaces/IClient";
import {DiscordClient} from "./wrappers/discord/DiscordClient";
import {ErrorHandler} from "./utils/ErrorHandler";
import {DiscordUser} from "./wrappers/discord/DiscordUser";
import {DiscordMessage} from "./wrappers/discord/DiscordMessage";
import {EventEmitter} from "events";
import {EventWrapper} from "./utils/EventWrapper";
import {DiscordEventHandler} from "./wrappers/discord/DiscordEventHandler";

const Discord = require("discord.js");
const client = new Discord.Client();

export class DiscordBot implements IBot {
	private _client: IClient;
	private readonly _events: EventEmitter;
	private readonly _token: string;
	private readonly _apiEvents = {
		error: {
			name: "error",
			returnClass: Error,
			isWrapped: false,
			isInitEvent: false
		},
		serverMemberAdd: {
			name: "guildMemberAdd",
			returnClass: DiscordUser,
			isWrapped: true,
			isInitEvent: false
		},
		serverMemberRemove: {
			name: "guildMemberRemove",
			returnClass: DiscordUser,
			isWrapped: true,
			isInitEvent: false
		},
		message: {
			name: "message",
			returnClass: DiscordMessage,
			isWrapped: true,
			isInitEvent: false
		},
		ready: {
			name: "ready",
			returnClass: null,
			isWrapped: false,
			isInitEvent: true
		}
	};

	constructor(token: string) {
		this._events = new EventEmitter();
		this._token = token;
	}

	onEvent(name: string, listener: (...args: any[]) => void): void {
		if (this._apiEvents.hasOwnProperty(name)) {
			let Event: DiscordEventHandler = new DiscordEventHandler(name, this._apiEvents);

			if (Event.isInitEvent()) {
				client.login(this._token).then(() => {
					let eventWrapper: EventWrapper = new EventWrapper(client, this._events);
					eventWrapper.registerEvents(this._apiEvents, true);

					this._client = new DiscordClient(client);
					listener();
				}).catch((error) => {
					ErrorHandler.throwError(error);
				});
			} else {
				this._events.on(name, listener);
			}
		} else {
			ErrorHandler.throwErrorMessage(`The event '${name}' is not supported.`);
		}
	}

	getClient(): IClient {
		if (this._client) {
			return this._client;
		} else {
			ErrorHandler.throwErrorMessage("The bot has not been initialized yet.");
		}
	}
}