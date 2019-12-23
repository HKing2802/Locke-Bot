"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DiscordClient_1 = require("../../src/wrappers/discord/DiscordClient");
const DiscordUser_1 = require("../../src/wrappers/discord/DiscordUser");
const DiscordServer_1 = require("../../src/wrappers/discord/DiscordServer");
const assert = require("assert");
describe("The class DiscordClient", function () {
    beforeEach(function () {
        let client = {
            _user: {}
        };
        this.Client = new DiscordClient_1.DiscordClient(client);
    });
    afterEach(function () {
        this.Client = null;
    });
    describe("The method getUser", function () {
        it("Returns the wrapped user object", function () {
            //Act
            let User = this.Client.getUser();
            //Assert
            assert.strictEqual(User instanceof DiscordUser_1.DiscordUser, true, "The user object was wrapped correctly.");
        });
    });
    describe("The method getServers", function () {
        it("Returns an empty array", function () {
            //Arrange
            let client = {
                on: function () { },
                guilds: {
                    array: function () {
                        return [];
                    }
                }
            };
            let Client = new DiscordClient_1.DiscordClient(client);
            //Act
            let Servers = Client.getServers();
            //Assert
            assert.deepStrictEqual(Servers, [], "An empty array was returned.");
        });
        it("Returns an array containing one server", function () {
            //Arrange
            let client = {
                on: function () { },
                guilds: {
                    array: function () {
                        return [{}];
                    }
                }
            };
            let Client = new DiscordClient_1.DiscordClient(client);
            //Act
            let Servers = Client.getServers();
            //Assert
            assert.strictEqual(Servers.length, 1, "The length of the returned array is correct.");
            assert.strictEqual(Servers[0] instanceof DiscordServer_1.DiscordServer, true, "The server object was wrapped correctly.");
        });
        it("Returns an array containing two servers", function () {
            //Arrange
            let client = {
                on: function () { },
                guilds: {
                    array: function () {
                        return [{}, {}];
                    }
                }
            };
            let Client = new DiscordClient_1.DiscordClient(client);
            //Act
            let Servers = Client.getServers();
            //Assert
            assert.strictEqual(Servers.length, 2, "The length of the returned array is correct.");
            assert.strictEqual(Servers[0] instanceof DiscordServer_1.DiscordServer, true, "The server object was wrapped correctly.");
            assert.strictEqual(Servers[1] instanceof DiscordServer_1.DiscordServer, true, "The server object was wrapped correctly.");
        });
    });
});
//# sourceMappingURL=DiscordClientTest.js.map