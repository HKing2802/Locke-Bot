import {EventEmitter} from "events";
import {DiscordEventHandler} from "../wrappers/discord/DiscordEventHandler";

export class EventWrapper {
	private readonly _originalEmitter: any;
	private readonly _wrappedEmitter: EventEmitter;

	constructor(originalEmitter: any, wrappedEmitter: EventEmitter) {
		this._originalEmitter = originalEmitter;
		this._wrappedEmitter = wrappedEmitter;
	}

	registerEvents(eventsToRegister: object, excludeInitEvents?: boolean) {
		for (let name in eventsToRegister) {
			if (eventsToRegister.hasOwnProperty(name)) {
				let Event: DiscordEventHandler = new DiscordEventHandler(name, eventsToRegister);
				let excludeEvent = excludeInitEvents ? Event.isInitEvent() : false;

				if (!excludeEvent) {
					Event.wrap(this._originalEmitter, this._wrappedEmitter);
				}
			}
		}
	}
}