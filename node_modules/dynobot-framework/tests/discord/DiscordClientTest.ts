import {DiscordClient} from "../../src/wrappers/discord/DiscordClient";
import {DiscordUser} from "../../src/wrappers/discord/DiscordUser";
import {DiscordServer} from "../../src/wrappers/discord/DiscordServer";
import {IServer} from "../../src/wrappers/interfaces/IServer";

const assert = require("assert");

describe("The class DiscordClient", function() {
	beforeEach(function() {
		let client: object = {
			_user: {}
		};
		this.Client = new DiscordClient(client);
	});

	afterEach(function() {
		this.Client = null;
	});

	describe("The method getUser", function() {
		it("Returns the wrapped user object", function() {
			//Act
			let User = this.Client.getUser();

			//Assert
			assert.strictEqual(User instanceof DiscordUser, true, "The user object was wrapped correctly.");
		});
	});

	describe("The method getServers", function() {
		it("Returns an empty array", function() {
			//Arrange
			let client: object = {
				on: function() {},
				guilds: {
					array: function() {
						return [];
					}
				}
			};
			let Client: DiscordClient = new DiscordClient(client);

			//Act
			let Servers: IServer[] = Client.getServers();

			//Assert
			assert.deepStrictEqual(Servers, [], "An empty array was returned.");
		});

		it("Returns an array containing one server", function() {
			//Arrange
			let client: object = {
				on: function() {},
				guilds: {
					array: function() {
						return [{}];
					}
				}
			};
			let Client: DiscordClient = new DiscordClient(client);

			//Act
			let Servers: IServer[] = Client.getServers();

			//Assert
			assert.strictEqual(Servers.length, 1, "The length of the returned array is correct.");
			assert.strictEqual(Servers[0] instanceof DiscordServer, true, "The server object was wrapped correctly.");
		});

		it("Returns an array containing two servers", function() {
			//Arrange
			let client: object = {
				on: function() {},
				guilds: {
					array: function() {
						return [{}, {}];
					}
				}
			};
			let Client: DiscordClient = new DiscordClient(client);

			//Act
			let Servers: IServer[] = Client.getServers();

			//Assert
			assert.strictEqual(Servers.length, 2, "The length of the returned array is correct.");
			assert.strictEqual(Servers[0] instanceof DiscordServer, true, "The server object was wrapped correctly.");
			assert.strictEqual(Servers[1] instanceof DiscordServer, true, "The server object was wrapped correctly.");
		});
	});
});