import {EventHandler} from "../../utils/EventHandler";
import {EventEmitter} from "events";

export class DiscordEventHandler extends EventHandler {
	constructor(name: string, events: object) {
		super(name, events);
	}

	wrap(originalEmitter: any, wrappedEmitter: EventEmitter): void {
		originalEmitter.on(this.getApiEventName(), (object) => {
			let WrappedObject = this.getWrappedObject(object);
			if (WrappedObject) {
				wrappedEmitter.emit(this._wrappedName, WrappedObject);
			} else {
				wrappedEmitter.emit(this._wrappedName);
			}
		});
	}
}