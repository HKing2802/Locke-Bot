"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DiscordClient_1 = require("../../src/wrappers/discord/DiscordClient");
const { DiscordBot } = require("../../src/DiscordBot");
const assert = require("assert");
require("dotenv").config();
const token = process.env.DISCORD_TOKEN;
describe("The class DiscordBot", function () {
    describe("The method onEvent", function () {
        this.timeout(5000);
        it("Throws an error when the event is not supported", function () {
            //Arrange
            let Bot = new DiscordBot(token);
            try {
                //Act
                Bot.onEvent("test", () => { });
            }
            catch (e) {
                //Assert
                assert.strictEqual(e.toString(), "Error: The event 'test' is not supported.", "The correct error was thrown.");
            }
        });
        it("Initialises the client after the ready event was called", function () {
            //Arrange
            let Bot = new DiscordBot(token);
            //Act
            let EventPromise = new Promise(resolve => {
                Bot.onEvent("ready", () => {
                    resolve();
                });
            });
            return EventPromise.then(() => {
                //Assert
                assert.strictEqual(Bot.getClient() instanceof DiscordClient_1.DiscordClient, true, "The client was initialised correctly.");
            });
        });
    });
    describe("The getter", function () {
        it("Has a getter which returns the wrapped client object when it was initialized", function () {
            //Act
            let Bot = new DiscordBot(token);
            //Assert
            Bot.onEvent("ready", () => {
                assert.strictEqual(Bot.getClient() instanceof DiscordClient_1.DiscordClient, true, "The wrapped client object was returned.");
            });
        });
        it("Returns an error because the bot has not been initialized yet", function () {
            //Act
            let Bot = new DiscordBot(token);
            //Assert
            try {
                assert.ifError(Bot.getClient());
            }
            catch (e) {
                assert.strictEqual(e.toString(), "Error: The bot has not been initialized yet.");
            }
        });
    });
});
//# sourceMappingURL=DiscordBotTest.js.map