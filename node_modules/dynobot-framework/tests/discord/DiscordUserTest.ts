import {DiscordUser} from "../../src/wrappers/discord/DiscordUser";
import {DiscordChannel} from "../../src/wrappers/discord/DiscordChannel";
import {DiscordServer} from "../../src/wrappers/discord/DiscordServer";
import {ErrorHandler} from "../../src/utils/ErrorHandler";

const assert = require("assert");
const sinon = require("sinon");

describe("The class DiscordUser", function() {
	beforeEach(function() {
		this._user = {
			id: 123,
			username: "name",
			guild: {},
			tag: "name#123"
		};
		this.User = new DiscordUser(this._user);
	});

	afterEach(function() {
		this.User = null;
	});

	describe("The method getId", function() {
		it("Returns the user id", function() {
			//Act
			let userId: number = this.User.getId();

			//Assert
			assert.strictEqual(userId, 123, "The correct user id was returned.");
		});
	});

	describe("The method getName", function() {
		it("Returns the username", function() {
			//Act
			let username: number = this.User.getName();

			//Assert
			assert.strictEqual(username, "name", "The correct username was returned.");
		});
	});

	describe("The method getTag", function() {
		it("Returns the user tag", function() {
			//Act
			let tag: number = this.User.getTag();

			//Assert
			assert.strictEqual(tag, "name#123", "The correct tag was returned.");
		});
	});

	describe("The method getServer", function() {
		it("Returns the wrapped server object", function() {
			//Act
			let Server: any = this.User.getServer();

			//Assert
			assert.strictEqual(Server instanceof DiscordServer, true, "The server object was wrapped correctly.");
		});

		it("Returns null because the user is not acting on a server", function() {
			//Arrange
			this._user.guild = null;
			let oErrorHandlerStub = sinon.stub(ErrorHandler, "log");

			//Act
			let Server: any = this.User.getServer();

			//Assert
			assert.strictEqual(oErrorHandlerStub.callCount, 1, "The error handler was called.");
			assert.strictEqual(Server, null, "There is no server, so null was returned.");

			//Cleanup
			oErrorHandlerStub.restore();
		});
	});

	describe("The method createDM", function() {
		it("Resolves the promise and returns the channel", function() {
			//Arrange
			let _user: object = {
				createDM: function() {
					return new Promise(resolve => {
						resolve({});
					});
				}
			};
			let User: DiscordUser = new DiscordUser(_user);

			//Act
			return User.createDM().then(resolve => {
				//Assert
				assert.strictEqual(resolve instanceof DiscordChannel, true, "The promise returned a wrapped DiscordChannel.");
			});
		});

		it("Rejects the promise and returns the reason", function() {
			//Arrange
			let _user: object = {
				createDM: function() {
					return new Promise((resolve, reject) => {
						reject("some reason");
					});
				}
			};
			let User: DiscordUser = new DiscordUser(_user);

			//Act
			return User.createDM().catch(reject => {
				//Assert
				assert.strictEqual(reject, "some reason", "The promise returned the reason for its rejection.");
			});
		});
	});

	describe("The method deleteDM", function() {
		it("Resolves the promise and returns the channel", function() {
			//Arrange
			let _user: object = {
				deleteDM: function() {
					return new Promise(resolve => {
						resolve({});
					});
				}
			};
			let User: DiscordUser = new DiscordUser(_user);

			//Act
			return User.deleteDM().then(resolve => {
				//Assert
				assert.strictEqual(resolve instanceof DiscordChannel, true, "The promise returned a wrapped DiscordChannel.");
			});
		});

		it("Rejects the promise and returns the reason", function() {
			//Arrange
			let _user: object = {
				deleteDM: function() {
					return new Promise((resolve, reject) => {
						reject("some reason");
					});
				}
			};
			let User: DiscordUser = new DiscordUser(_user);

			//Act
			return User.deleteDM().catch(reject => {
				//Assert
				assert.strictEqual(reject, "some reason", "The promise returned the reason for its rejection.");
			});
		});
	});
});
