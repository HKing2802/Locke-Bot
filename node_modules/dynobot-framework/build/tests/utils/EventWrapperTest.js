"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const EventWrapper_1 = require("../../src/utils/EventWrapper");
const DiscordEventHandler_1 = require("../../src/wrappers/discord/DiscordEventHandler");
const assert = require("assert");
const sinon = require("sinon");
describe("The class EventWrapper", function () {
    describe("The method registerEvents", function () {
        beforeEach(function () {
            this.originalEmitter = new events_1.EventEmitter();
            this.eventsToRegister = {
                ready: {
                    name: "ready",
                    returnClass: null,
                    isWrapped: false,
                    isInitEvent: true
                },
                serverMemberAdd: {
                    name: "guildMemberAdd",
                    returnClass: null,
                    isWrapped: false,
                    isInitEvent: false
                }
            };
            this.wrappedEmitter = new events_1.EventEmitter();
            this.EventWrapper = new EventWrapper_1.EventWrapper(this.originalEmitter, this.wrappedEmitter);
            this.wrapStub = sinon.stub(DiscordEventHandler_1.DiscordEventHandler.prototype, "wrap");
        });
        afterEach(function () {
            this.originalEmitter = null;
            this.wrappedEmitter = null;
            this.EventEmitter = null;
            this.wrapStub.restore();
        });
        it("Registers all events including init events", function () {
            //Act
            this.EventWrapper.registerEvents(this.eventsToRegister);
            //Assert
            assert.strictEqual(this.wrapStub.callCount, 2, "The wrap method has been called twice.");
            assert.strictEqual(this.wrapStub.getCall(0).args[0], this.originalEmitter, "The correct emitter was passed.");
            assert.strictEqual(this.wrapStub.getCall(0).args[1], this.wrappedEmitter, "The correct emitter was passed.");
            assert.strictEqual(this.wrapStub.getCall(1).args[0], this.originalEmitter, "The correct emitter was passed.");
            assert.strictEqual(this.wrapStub.getCall(1).args[1], this.wrappedEmitter, "The correct emitter was passed.");
        });
        it("Registers all events excluding init events", function () {
            //Act
            this.EventWrapper.registerEvents(this.eventsToRegister, true);
            //Assert
            assert.strictEqual(this.wrapStub.callCount, 1, "The wrap method has been called twice.");
            assert.strictEqual(this.wrapStub.getCall(0).args[0], this.originalEmitter, "The correct emitter was passed.");
            assert.strictEqual(this.wrapStub.getCall(0).args[1], this.wrappedEmitter, "The correct emitter was passed.");
        });
    });
});
//# sourceMappingURL=EventWrapperTest.js.map