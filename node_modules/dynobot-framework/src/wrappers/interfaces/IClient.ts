import {IServer} from "./IServer";
import {IUser} from "./IUser";

export interface IClient {
	/**
	 * Get the wrapped user object from the client.
	 * @return The user object of the client
	 */
	getUser(): IUser

	/**
	 * Get the servers the client is on.
	 * @return The servers of the client
	 */
	getServers(): IServer[]
}