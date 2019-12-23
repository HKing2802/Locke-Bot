import {DiscordMessage} from "../../src/wrappers/discord/DiscordMessage";
import {DiscordChannel} from "../../src/wrappers/discord/DiscordChannel";
import {DiscordUser} from "../../src/wrappers/discord/DiscordUser";
import {DiscordRole} from "../../src/wrappers/discord/DiscordRole";
import {DiscordServer} from "../../src/wrappers/discord/DiscordServer";
import {IUser} from "../../src/wrappers/interfaces/IUser";

const assert = require("assert");

describe("The class DiscordMessage", function() {
	beforeEach(function() {
		this.roles = ["admin", "bot"];
		this.message = {
			author: {},
			content: "@Bot Do some stuff",
			channel: {},
			createdAt: 123,
			deletable: true,
			guild: {},
			member: {
				roles: {
					array: function() {
						return this.roles;
					}.bind(this)
				}
			},
			mentions: {
				users: [{
					id: "1"
				}, {
					id: "2"
				}]
			}
		};
		this.Message = new DiscordMessage(this.message);
	});

	afterEach(function() {
		this.message = {};
		this.Message = null;
	});

	describe("The method getChannel", function() {
		it("Returns the wrapped channel object", function() {
			//Act
			let Channel = this.Message.getChannel();

			//Assert
			assert.strictEqual(Channel instanceof DiscordChannel, true, "The message object was wrapped.");
		});
	});

	describe("The method getContent", function() {
		it("Returns the message content excluding the first word", function() {
			//Act
			let content: string = this.Message.getContent(true);

			//Assert
			assert.strictEqual(content, "Do some stuff", "The correct content was returned.");
		});

		it("Returns the message content including the first word", function() {
			//Act
			let content: string = this.Message.getContent();

			//Assert
			assert.strictEqual(content, "@Bot Do some stuff", "The correct content was returned.");
		});
	});

	describe("The method getContentArray", function() {
		it("Returns the message content as array excluding the first word", function() {
			//Act
			let contentArray: string[] = this.Message.getContentArray(true);

			//Assert
			assert.deepStrictEqual(contentArray, ["Do", "some", "stuff"], "The correct content array was returned.");
		});

		it("Returns the message content as array including the first word", function() {
			//Act
			let contentArray: string[] = this.Message.getContentArray();

			//Assert
			assert.deepStrictEqual(contentArray, ["@Bot", "Do", "some", "stuff"], "The correct content array was returned.");
		});
	});

	describe("The method getRegexGroups", function() {
		it("Returns the correct regex groups of the message content", function() {
			//Act
			let regexGroups = this.Message.getRegexGroups(/(Do)\s(some)/);

			//Assert
			assert.deepStrictEqual(regexGroups.toString(), "Do some,Do,some", "The correct regex groups were returned.");
		});
	});

	describe("The method getAuthor", function() {
		it("Returns the wrapped author object", function() {
			//Act
			let Author = this.Message.getAuthor();

			//Assert
			assert.strictEqual(Author instanceof DiscordUser, true, "The author object was wrapped correctly.");
		});
	});

	describe("The method getAuthorRoles", function() {
		it("Returns an array of wrapped role objects", function() {
			//Act
			let Roles = this.Message.getAuthorRoles();

			//Assert
			assert.strictEqual(Roles.length, 2, "The correct amount of roles was returned.");
			assert.strictEqual(Roles[0] instanceof DiscordRole, true, "The first roles was wrapped correctly.");
			assert.strictEqual(Roles[1] instanceof DiscordRole, true, "The second roles was wrapped correctly.");
		});

		it("Returns an empty array because there are no roles", function() {
			//Arrange
			this.message.member.roles = {
				array: function() {
					return [];
				}
			};

			//Act
			let Roles = this.Message.getAuthorRoles();

			//Assert
			assert.deepStrictEqual(Roles, [], "An empty array was returned.");
		});

		it("Returns an empty array because there is no member defined", function() {
			this.message.member = null;

			//Act
			let Roles = this.Message.getAuthorRoles();

			//Assert
			assert.deepStrictEqual(Roles, [], "An empty array was returned.");
		});

		it("Returns an empty array because the no roles are defined", function() {
			this.message.member.roles = null;

			//Act
			let Roles = this.Message.getAuthorRoles();

			//Assert
			assert.deepStrictEqual(Roles, [], "An empty array was returned.");
		});
	});

	describe("The method hasServer", function() {
		it("Returns true because the message object has a server object", function() {
			//Act
			let hasServer: boolean = this.Message.hasServer();

			//Assert
			assert.strictEqual(hasServer, true, "The message object has a server object.");
		});

		it("Returns false because the message object has no server object", function() {
			//Arrange
			this.message.guild = null;

			//Act
			let hasServer: boolean = this.Message.hasServer();

			//Assert
			assert.strictEqual(hasServer, false, "The message object has no server object.");
		});
	});

	describe("The method getServer", function() {
		it("Returns the wrapped server object", function() {
			//Act
			let Server = this.Message.getServer();

			//Assert
			assert.strictEqual(Server instanceof DiscordServer, true, "The server object was wrapped correctly.");
		});

		it("Returns null and throws an error when there is no server object", function() {
			//Arrange
			this.message.guild = null;

			//Act
			try {
				assert.ifError(this.Message.getServer());
			} catch (e) {
				assert.strictEqual(e.toString(), "Error: The message was not sent on a server.", "The correct error was thrown.");
			}
		});
	});

	describe("The method isMentioned", function() {
		it("Returns true because the user was mentioned", function() {
			//Arrange
			let user: object = {
				id: "2"
			};
			let User: IUser = new DiscordUser(user);

			//Act
			let isMentioned: boolean = this.Message.isMentioned(User);

			//Assert
			assert.strictEqual(isMentioned, true, "The user was mentioned in the message.");
		});

		it("Returns false because the user was mentioned", function() {
			//Arrange
			let user: object = {
				id: "3"
			};
			let User: IUser = new DiscordUser(user);

			//Act
			let isMentioned: boolean = this.Message.isMentioned(User);

			//Assert
			assert.strictEqual(isMentioned, false, "The user was not mentioned in the message.");
		});
	});

	describe("The method isDeletable", function() {
		it("Returns the deletable property of the message object", function() {
			//Act
			let isDeletable: boolean = this.Message.isDeletable();

			//Assert
			assert.strictEqual(isDeletable, true, "The message is deletable.");
		});
	});

	describe("The method delete", function() {
		it("Deletes the message and returns the wrapped object", function() {
			//Arrange
			this.message.delete = function() {
				return Promise.resolve(this.message);
			}.bind(this);

			//Act
			return this.Message.delete().then(message => {
				//Assert
				assert.strictEqual(message instanceof DiscordMessage, true, "The wrapped message object was returned.");
			});
		});

		it("Deletes the message and returns the wrapped object", function() {
			//Arrange
			this.message.delete = function() {
				return Promise.reject(new Error("Some error"));
			};

			//Act
			return this.Message.delete().catch(error => {
				//Assert
				assert.strictEqual(error instanceof Error, true, "The an error object was returned.");
				assert.strictEqual(error.toString(), "Error: Some error", "The error has the correct message.");
			});
		});
	});

	describe("The method getCreationDate", function() {
		it("Returns the creation date of the message", function() {
			//Act
			let creationDate = this.Message.getCreationDate();

			//Assert
			assert.strictEqual(creationDate, 123, "The correct creation date was returned.");
		});
	});
});