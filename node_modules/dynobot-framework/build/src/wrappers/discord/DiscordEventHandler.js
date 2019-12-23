"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EventHandler_1 = require("../../utils/EventHandler");
class DiscordEventHandler extends EventHandler_1.EventHandler {
    constructor(name, events) {
        super(name, events);
    }
    wrap(originalEmitter, wrappedEmitter) {
        originalEmitter.on(this.getApiEventName(), (object) => {
            let WrappedObject = this.getWrappedObject(object);
            if (WrappedObject) {
                wrappedEmitter.emit(this._wrappedName, WrappedObject);
            }
            else {
                wrappedEmitter.emit(this._wrappedName);
            }
        });
    }
}
exports.DiscordEventHandler = DiscordEventHandler;
//# sourceMappingURL=DiscordEventHandler.js.map