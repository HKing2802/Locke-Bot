import {EventEmitter} from "events";
import {EventWrapper} from "../../src/utils/EventWrapper";
import {DiscordEventHandler} from "../../src/wrappers/discord/DiscordEventHandler";

const assert = require("assert");
const sinon = require("sinon");

describe("The class EventWrapper", function() {
	describe("The method registerEvents", function() {
		beforeEach(function() {
			this.originalEmitter = new EventEmitter();
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
			this.wrappedEmitter = new EventEmitter();
			this.EventWrapper = new EventWrapper(this.originalEmitter, this.wrappedEmitter);
			this.wrapStub = sinon.stub(DiscordEventHandler.prototype, "wrap");
		});

		afterEach(function() {
			this.originalEmitter = null;
			this.wrappedEmitter = null;
			this.EventEmitter = null;
			this.wrapStub.restore();
		});

		it("Registers all events including init events", function() {
			//Act
			this.EventWrapper.registerEvents(this.eventsToRegister);

			//Assert
			assert.strictEqual(this.wrapStub.callCount, 2, "The wrap method has been called twice.");
			assert.strictEqual(this.wrapStub.getCall(0).args[0], this.originalEmitter, "The correct emitter was passed.");
			assert.strictEqual(this.wrapStub.getCall(0).args[1], this.wrappedEmitter, "The correct emitter was passed.");
			assert.strictEqual(this.wrapStub.getCall(1).args[0], this.originalEmitter, "The correct emitter was passed.");
			assert.strictEqual(this.wrapStub.getCall(1).args[1], this.wrappedEmitter, "The correct emitter was passed.");
		});

		it("Registers all events excluding init events", function() {
			//Act
			this.EventWrapper.registerEvents(this.eventsToRegister, true);

			//Assert
			assert.strictEqual(this.wrapStub.callCount, 1, "The wrap method has been called twice.");
			assert.strictEqual(this.wrapStub.getCall(0).args[0], this.originalEmitter, "The correct emitter was passed.");
			assert.strictEqual(this.wrapStub.getCall(0).args[1], this.wrappedEmitter, "The correct emitter was passed.");
		});
	});
});