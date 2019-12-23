import {DiscordRole} from "../../src/wrappers/discord/DiscordRole";
const assert = require("assert");

describe("The class DiscordRole", function() {
	beforeEach(function() {
		this._role = {
			id: 123,
			name: "roleName",
			color: 321,
			permissions: 12345
		};
		this.Role = new DiscordRole(this._role);
	});

	afterEach(function() {
		this.Role = null;
		this._role = null;
	});

	describe("The method getId", function() {
		it("Returns the role id as number", function() {
			//Assert
			assert.strictEqual(this.Role.getId(), this._role.id, "The correct role id was returned.");
		});
	});

	describe("The method getName", function() {
		it("Returns the role name as string", function() {
			//Assert
			assert.strictEqual(this.Role.getName(), this._role.name, "The correct role name was returned.");
		});
	});

	describe("The method getColor", function() {
		it("Returns the role color as number", function() {
			//Assert
			assert.strictEqual(this.Role.getColor(), this._role.color, "The correct role color was returned.");
		});
	});

	describe("The method getPermissions", function() {
		it("Returns the role permissions as number", function() {
			//Assert
			assert.deepStrictEqual(this.Role.getPermissions(), this._role.permissions, "The correct role permissions were returned.");
		});
	});
});
