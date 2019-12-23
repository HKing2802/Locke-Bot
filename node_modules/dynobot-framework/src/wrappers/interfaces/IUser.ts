import {DiscordChannel} from "../discord/DiscordChannel";
import {IServer} from "./IServer";

export interface IUser {
	/**
	 * Get the id of the user.
	 * @return The user id
	 */
	getId(): number;

	/**
	 * Get the name of the user.
	 * @return The username
	 */
	getName(): string;

	/**
	 * Gets the tag of the user which makes it identifiable on a server
	 * @return The user tag
	 */
	getTag(): string;

	/**
	 * Gets the server the user is acting on.
	 * @return The server object, null when the user is not acting on a server
	 */
	getServer(): IServer;

	/**
	 * Creates a private message channel.
	 * @return The channel for private messages
	 */
	createDM(): Promise<DiscordChannel>;

	/**
	 * Deletes a private message channel.
	 * @return The channel which has been deleted
	 */
	deleteDM(): Promise<DiscordChannel>;
}
