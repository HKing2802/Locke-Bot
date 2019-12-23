"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DiscordServer_1 = require("../../src/wrappers/discord/DiscordServer");
const DiscordUser_1 = require("../../src/wrappers/discord/DiscordUser");
const DiscordChannel_1 = require("../../src/wrappers/discord/DiscordChannel");
const DiscordRole_1 = require("../../src/wrappers/discord/DiscordRole");
const assert = require("assert");
describe("The class DiscordServer", function () {
    beforeEach(function () {
        this.server = {
            id: 123,
            name: "serverName",
            members: {
                array: function () {
                    return [];
                }
            },
            channels: {
                array: function () {
                    return [];
                }
            },
            roles: {
                array: function () {
                    return [];
                }
            }
        };
        this.Server = new DiscordServer_1.DiscordServer(this.server);
    });
    describe("The method getId", function () {
        it("Returns the server id", function () {
            //Act
            let serverId = this.Server.getId();
            //Assert
            assert.strictEqual(serverId, 123, "The correct server id was returned.");
        });
    });
    describe("The method getName", function () {
        it("Returns the server name", function () {
            //Act
            let serverName = this.Server.getName();
            //Assert
            assert.strictEqual(serverName, "serverName", "The correct server name was returned.");
        });
    });
    describe("The method getMembers", function () {
        it("Returns an empty array because there are no members", function () {
            //Act
            let Members = this.Server.getMembers();
            //Assert
            assert.deepStrictEqual(Members, [], "An empty array was returned.");
        });
        it("Returns an array of wrapped user objects", function () {
            //Arrange
            this.server.members.array = function () {
                return [{
                        user: {}
                    }, {
                        user: {}
                    }];
            };
            //Act
            let Members = this.Server.getMembers();
            //Assert
            assert.strictEqual(Members.length, 2, "The correct amount of members was returned.");
            assert.strictEqual(Members[0] instanceof DiscordUser_1.DiscordUser, true, "The first member object was wrapped correctly.");
            assert.strictEqual(Members[1] instanceof DiscordUser_1.DiscordUser, true, "The second member object was wrapped correctly.");
        });
    });
    describe("The method getChannels", function () {
        it("Returns an empty array because there are no channels", function () {
            //Act
            let Channels = this.Server.getChannels();
            //Assert
            assert.deepStrictEqual(Channels, [], "An empty array was returned.");
        });
        it("Returns an array of wrapped channel objects", function () {
            //Arrange
            this.server.channels.array = function () {
                return [{}, {}];
            };
            //Act
            let Channels = this.Server.getChannels();
            //Assert
            assert.strictEqual(Channels.length, 2, "The correct amount of channels was returned.");
            assert.strictEqual(Channels[0] instanceof DiscordChannel_1.DiscordChannel, true, "The first channel object was wrapped correctly.");
            assert.strictEqual(Channels[1] instanceof DiscordChannel_1.DiscordChannel, true, "The second channel object was wrapped correctly.");
        });
    });
    describe("The method hasChannel", function () {
        it("Returns false because there are no channels", function () {
            //Act
            let hasChannel = this.Server.hasChannel("123");
            //Assert
            assert.strictEqual(hasChannel, false, "The channel does not exist.");
        });
        it("Returns false because the requested channel does not exist", function () {
            //Arrange
            this.server.channels.array = function () {
                return [{
                        id: "312"
                    }];
            };
            //Act
            let hasChannel = this.Server.hasChannel("123");
            //Assert
            assert.strictEqual(hasChannel, false, "The channel does not exist.");
        });
        it("Returns the requested channel", function () {
            //Arrange
            this.server.channels.array = function () {
                return [{
                        id: "312"
                    }, {
                        id: "123"
                    }];
            };
            //Act
            let hasChannel = this.Server.hasChannel("123");
            //Assert
            assert.strictEqual(hasChannel instanceof DiscordChannel_1.DiscordChannel, true, "The channel exists and was returned.");
        });
    });
    describe("The method getRoles", function () {
        it("Returns an empty array because there are no roles", function () {
            //Act
            let Roles = this.Server.getRoles();
            //Assert
            assert.deepStrictEqual(Roles, [], "An empty array was returned.");
        });
        it("Returns an array of wrapped role objects", function () {
            //Arrange
            this.server.roles.array = function () {
                return [{}, {}];
            };
            //Act
            let Roles = this.Server.getRoles();
            //Assert
            assert.strictEqual(Roles.length, 2, "The correct amount of roles was returned.");
            assert.strictEqual(Roles[0] instanceof DiscordRole_1.DiscordRole, true, "The first role object was wrapped correctly.");
            assert.strictEqual(Roles[1] instanceof DiscordRole_1.DiscordRole, true, "The second role object was wrapped correctly.");
        });
    });
});
//# sourceMappingURL=DiscordServerTest.js.map