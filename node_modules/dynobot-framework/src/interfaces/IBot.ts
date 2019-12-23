import {IClient} from "../wrappers/interfaces/IClient";

export interface IBot {
	/**
	 * Executes a given listener function when the referred event was triggered
	 * @param name - The name of the event
	 * @param listener - The event listener, a function which shall be executed once the event was triggered
	 */
	onEvent(name: string, listener: (...args: any[]) => void): void;

	/**
	 * Get the wrapped client object from the bot
	 * @return The wrapped client object
	 */
	getClient(): IClient;
}