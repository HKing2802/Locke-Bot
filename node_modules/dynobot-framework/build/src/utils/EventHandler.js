"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class EventHandler {
    constructor(name, events) {
        this._events = events;
        if (events.hasOwnProperty(name)) {
            this._apiEventName = events[name].name;
            this._isInitEvent = events[name].isInitEvent;
            this._wrappedName = name;
        }
    }
    isInitEvent() {
        return this._isInitEvent;
    }
    getApiEventName() {
        return this._apiEventName;
    }
    getWrappedObject(object) {
        let event = this._events[this._wrappedName];
        let WrappedClass = event.returnClass;
        if (WrappedClass) {
            return event.isWrapped ? new WrappedClass(object) : object;
        }
        else {
            return null;
        }
    }
}
exports.EventHandler = EventHandler;
//# sourceMappingURL=EventHandler.js.map