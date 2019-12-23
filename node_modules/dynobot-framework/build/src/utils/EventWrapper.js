"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DiscordEventHandler_1 = require("../wrappers/discord/DiscordEventHandler");
class EventWrapper {
    constructor(originalEmitter, wrappedEmitter) {
        this._originalEmitter = originalEmitter;
        this._wrappedEmitter = wrappedEmitter;
    }
    registerEvents(eventsToRegister, excludeInitEvents) {
        for (let name in eventsToRegister) {
            if (eventsToRegister.hasOwnProperty(name)) {
                let Event = new DiscordEventHandler_1.DiscordEventHandler(name, eventsToRegister);
                let excludeEvent = excludeInitEvents ? Event.isInitEvent() : false;
                if (!excludeEvent) {
                    Event.wrap(this._originalEmitter, this._wrappedEmitter);
                }
            }
        }
    }
}
exports.EventWrapper = EventWrapper;
//# sourceMappingURL=EventWrapper.js.map