import {DiscordMessage} from "../../src/wrappers/discord/DiscordMessage";
import {EventEmitter} from "events";
import {DiscordEventHandler} from "../../src/wrappers/discord/DiscordEventHandler";

const assert = require("assert");
const sinon = require("sinon");

describe("The class DiscordEventHandler", function() {
	beforeEach(function() {
		this._apiEvents = {
			error: {
				name: "error",
				returnClass: Error,
				isWrapped: false
			},
			serverMemberAdd: {
				name: "guildMemberAdd"
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
	});

	afterEach(function() {
		this._apiEvents = null;
	});

	describe("The method isInitEvent", function() {
		it("Returns false because the event is not an init event", function() {
			//Arrange
			let Event: DiscordEventHandler = new DiscordEventHandler("message", this._apiEvents);

			//Act
			let isInitEvent: boolean = Event.isInitEvent();

			//Assert
			assert.strictEqual(isInitEvent, false, "The event is not an init event.");
		});

		it("Returns true because the event is an init event", function() {
			//Arrange
			let Event: DiscordEventHandler = new DiscordEventHandler("ready", this._apiEvents);

			//Act
			let isInitEvent: boolean = Event.isInitEvent();

			//Assert
			assert.strictEqual(isInitEvent, true, "The event is an init event.");
		});
	});

	describe("The method getApiEventName", function() {
		it("Returns the original unwrapped api event name", function() {
			//Arrange
			let Event: DiscordEventHandler = new DiscordEventHandler("serverMemberAdd", this._apiEvents);

			//Act
			let apiEventName: string = Event.getApiEventName();

			//Assert
			assert.strictEqual(apiEventName, "guildMemberAdd", "The correct name of the original api event was returned.");
		});
	});

	describe("The method getWrappedObject", function() {
		it("Returns the wrapped object of the event", function() {
			//Arrange
			let Event: DiscordEventHandler = new DiscordEventHandler("message", this._apiEvents);
			let apiObject: object = {};

			//Act
			let WrappedObject: any = Event.getWrappedObject(apiObject);

			//Assert
			assert.strictEqual(WrappedObject instanceof DiscordMessage, true, "The api object was wrapped correctly.");
		});

		it("Returns the api object because it should not be wrapped", function() {
			//Arrange
			let Event: DiscordEventHandler = new DiscordEventHandler("error", this._apiEvents);
			let apiObject: Error = new Error("test error");

			//Act
			let WrappedObject: any = Event.getWrappedObject(apiObject);

			//Assert
			assert.strictEqual(WrappedObject, apiObject, "The api object was returned because it should not be wrapped.");
		});

		it("Returns null if the event has no return value and shall not be wrapped", function() {
			//Arrange
			let Event: DiscordEventHandler = new DiscordEventHandler("ready", this._apiEvents);

			//Act
			let WrappedObject: any = Event.getWrappedObject(undefined);

			//Assert
			assert.strictEqual(WrappedObject, null, "Null was returned because the wrapped event has no return value.");
		});
	});

	describe("The method wrap", function() {
		it("Emits the wrapped event and hands over a wrapped object", function() {
			//Arrange
			let OriginalEmitter: EventEmitter = new EventEmitter();
			let WrappedEmitter: EventEmitter = new EventEmitter();
			let wrappedEmitStub = sinon.stub(WrappedEmitter, "emit");
			let eventObject = {};

			let Event: DiscordEventHandler = new DiscordEventHandler("message", this._apiEvents);

			let getApiEventNameStub = sinon.stub(Event, "getApiEventName").returns("message");
			let getWrappedObjectStub = sinon.stub(Event, "getWrappedObject").returns(new DiscordMessage(eventObject));

			//Act
			Event.wrap(OriginalEmitter, WrappedEmitter);
			OriginalEmitter.emit("message", eventObject);

			//Assert
			WrappedEmitter.on("message", eventObject => {
				assert.strictEqual(getApiEventNameStub.callCount, 1, "The method getApiEventName was called once.");
				assert.strictEqual(getWrappedObjectStub.callCount, 1, "The method getWrappedObject was called once.");
				assert.strictEqual(getWrappedObjectStub.getCall(0).args[0], eventObject, "The method getWrappedObject was called with the correct parameter.");
				assert.strictEqual(wrappedEmitStub.callCount, 1, "The wrapped event was emitted.");
				assert.strictEqual(wrappedEmitStub.getCall(0).args[0], "message", "The event name was handed over correctly.");
				assert.strictEqual(wrappedEmitStub.getCall(0).args[1] instanceof DiscordMessage, true, "The object was wrapped correctly.");
			});
		});

		it("Emits the wrapped event without handing over a wrapped object", function() {
			//Arrange
			let OriginalEmitter: EventEmitter = new EventEmitter();
			let WrappedEmitter: EventEmitter = new EventEmitter();
			let wrappedEmitStub = sinon.stub(WrappedEmitter, "emit");
			let eventObject = {};

			let Event: DiscordEventHandler = new DiscordEventHandler("message", this._apiEvents);

			let getApiEventNameStub = sinon.stub(Event, "getApiEventName").returns("message");
			let getWrappedObjectStub = sinon.stub(Event, "getWrappedObject").returns(null);

			//Act
			Event.wrap(OriginalEmitter, WrappedEmitter);
			OriginalEmitter.emit("message", eventObject);

			//Assert
			WrappedEmitter.on("message", eventObject => {
				assert.strictEqual(getApiEventNameStub.callCount, 1, "The method getApiEventName was called once.");
				assert.strictEqual(getWrappedObjectStub.callCount, 1, "The method getWrappedObject was called once.");
				assert.strictEqual(getWrappedObjectStub.getCall(0).args[0], eventObject, "The method getWrappedObject was called with the correct parameter.");
				assert.strictEqual(wrappedEmitStub.callCount, 1, "The wrapped event was emitted.");
				assert.strictEqual(wrappedEmitStub.calledWith("message"), true, "The event name was handed over correctly.");
			});
		});
	});
});