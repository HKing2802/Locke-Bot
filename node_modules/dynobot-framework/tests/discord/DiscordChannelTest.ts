import {DiscordChannel} from "../../src/wrappers/discord/DiscordChannel";
import {DiscordServer} from "../../src/wrappers/discord/DiscordServer";
import {DiscordMessage} from "../../src/wrappers/discord/DiscordMessage";

const assert = require("assert");
const sinon = require("sinon");

describe("The class DiscordChannel", function() {
	beforeEach(function() {
		this.channel = {
			id: 123,
			name: "channelName",
			guild: {},
			send: function() {},
			fetchMessages: function() {},
			awaitMessages: function() {}
		};
		this.Channel = new DiscordChannel(this.channel);
	});

	afterEach(function() {
		this.channel = {};
		this.Channel = null;
	});

	describe("The method isTextChannel", function() {
		it("Is a text channel and returns true", function() {
			//Act
			let isTextChannel: boolean = this.Channel.isTextChannel();

			//Arrange
			assert.strictEqual(isTextChannel, true, "The channel is a text channel.");
		});

		it("Is not a text channel and returns false", function() {
			//Arrange
			this.channel.send = undefined;

			//Act
			let isTextChannel: boolean = this.Channel.isTextChannel();

			//Arrange
			assert.strictEqual(isTextChannel, false, "The channel is not a text channel.");
		});
	});

	describe("The method send", function() {
		it("Calls the send message of the api", function() {
			//Arrange
			let options: object = {
				"some": "options"
			};
			let sendStub = sinon.stub(this.channel, "send");

			//Act
			this.Channel.send("test", options);

			//Assert
			assert.strictEqual(sendStub.callCount, 1, "The send method of the api was called.");
			assert.strictEqual(sendStub.getCall(0).args[0], "test", "The first parameter of the send function is correct.");
			assert.strictEqual(sendStub.getCall(0).args[1], options, "The second parameter of the send function is correct.");

			//Cleanup
			sendStub.restore();
		});

		it("Throws an error because there is no send method for this channel", function() {
			//Arrange
			this.channel.send = undefined;

			//Act
			try {
				this.Channel.send("test");
			} catch (e) {
				assert.strictEqual(e.toString(), "Error: This channel doesn't allow sending messages.", "The error message is correct.");
			}
		});
	});

	describe("The method getId", function() {
		it("Returns the channel id", function() {
			//Act
			let channelId: number = this.Channel.getId();

			//Assert
			assert.strictEqual(channelId, 123, "The correct channel id was returned.");
		});
	});

	describe("The method getName", function() {
		it("Returns the channel name", function() {
			//Act
			let channelName: string = this.Channel.getName();

			//Assert
			assert.strictEqual(channelName, "channelName", "The correct channel name was returned.");
		});
	});

	describe("The method getServer", function() {
		it("Returns the wrapped server object", function() {
			//Act
			let Server = this.Channel.getServer();

			//Assert
			assert.strictEqual(Server instanceof DiscordServer, true, "The server object was wrapped correctly.");
		});
	});

	describe("The method getMessages", function() {
		it("Returns the requested messages", function() {
			//Arrange
			let messagesReturned = [{}, {}];
			let fetchMessagesStub = sinon.stub(this.channel, "fetchMessages").returns(Promise.resolve(messagesReturned));

			//Act
			return this.Channel.getMessages(2).then(messages => {
				//Assert
				assert.strictEqual(fetchMessagesStub.callCount, 1, "The method fetchMessages was called.");
				assert.deepStrictEqual(fetchMessagesStub.getCall(0).args[0], {limit: 2}, "The method fetchMessages was called with the correct parameters.");
				assert.strictEqual(messages.length, 2, "The amount of returned messages is correct.");
				assert.strictEqual(messages[0] instanceof DiscordMessage, true, "The first message object was wrapped correctly.");
				assert.strictEqual(messages[1] instanceof DiscordMessage, true, "The second message object was wrapped correctly.");
			});
		});

		it("Returns an error when fetchMessages was rejected", function() {
			//Arrange
			let fetchMessagesStub = sinon.stub(this.channel, "fetchMessages").returns(Promise.reject(new Error("Some error")));

			//Act
			return this.Channel.getMessages(2).catch(error => {
				//Assert
				assert.strictEqual(fetchMessagesStub.callCount, 1, "The message fetchMessages was called.");
				assert.deepStrictEqual(fetchMessagesStub.getCall(0).args[0], {limit: 2}, "The method fetchMessages was called with the correct parameters.");
				assert.strictEqual(error instanceof Error, true, "An error was returned.");
			});
		});
	});

	describe("The method deleteMessages", function() {
		it("Returns the deleted messages", function() {
			//Arrange
			let FirstMessage = new DiscordMessage({});
			let SecondMessage = new DiscordMessage({});
			sinon.stub(FirstMessage, "delete").returns(Promise.resolve(FirstMessage));
			sinon.stub(SecondMessage, "delete").returns(Promise.resolve(SecondMessage));

			//Act
			return this.Channel.deleteMessages([FirstMessage, SecondMessage]).then(messages => {
				//Assert
				assert.strictEqual(messages.length, 2, "The amount of returned messages is correct.");
				assert.strictEqual(messages[0], FirstMessage, "The correct message was deleted and returned.");
				assert.strictEqual(messages[1], SecondMessage, "The correct message was deleted and returned.");
			});
		});

		it("Returns an error because the delete promise of a message was rejected", function() {
			//Arrange
			let Message = new DiscordMessage({});
			sinon.stub(Message, "delete").returns(Promise.reject(new Error("Some error")));

			//Act
			return this.Channel.deleteMessages([Message]).catch(error => {
				assert.strictEqual(error instanceof Error, true, "An error object was returned.");
				assert.strictEqual(error.toString(), "Error: Some error", "The correct error was returned.");
			});
		});
	});

	describe("The method awaitMessages", function() {
		it("Returns the requested messages", function() {
			//Arrange
			let options = {
				"some": "option"
			};
			let messagesReturned = {
				array: function() {
					return [{}, {}];
				}
			};
			let awaitMessagesStub = sinon.stub(this.channel, "awaitMessages").returns(Promise.resolve(messagesReturned));

			//Act
			return this.Channel.awaitMessages(options).then(messages => {
				//Assert
				assert.strictEqual(awaitMessagesStub.callCount, 1, "The method awaitMessages was called.");
				assert.deepStrictEqual(awaitMessagesStub.getCall(0).args[1], options, "The method awaitMessages was called with the correct parameters.");
				assert.strictEqual(messages.length, 2, "The amount of returned messages is correct.");
				assert.strictEqual(messages[0] instanceof DiscordMessage, true, "The first message object was wrapped correctly.");
				assert.strictEqual(messages[1] instanceof DiscordMessage, true, "The second message object was wrapped correctly.");
			});
		});

		it("Returns an error when awaitMessages was rejected", function() {
			//Arrange
			let options = {
				"some": "options"
			};
			let awaitMessagesStub = sinon.stub(this.channel, "awaitMessages").returns(Promise.reject(new Error("Some error")));

			//Act
			return this.Channel.awaitMessages(options).catch(error => {
				//Assert
				assert.strictEqual(awaitMessagesStub.callCount, 1, "The message awaitMessages was called.");
				assert.deepStrictEqual(awaitMessagesStub.getCall(0).args[1], options, "The method awaitMessages was called with the correct parameters.");
				assert.strictEqual(error instanceof Error, true, "An error was returned.");
			});
		});
	});
});