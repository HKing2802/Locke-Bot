import {IServer} from "./IServer";
import {IMessage} from "./IMessage";

export interface IChannel {
	/**
	 * Return whether the channel is a text channel.
	 * @return True if the channel is a text channel, else false
	 */
	isTextChannel(): boolean;

	/**
	 * Send a message to the channel.
	 * @param [message] - The message to send
	 * @param [options] - Options for the message, can also be just a RichEmbed or Attachment
	 */
	send(message?: string, options?: any);

	/**
	 * Get the channel id.
	 * @return The channel id
	 */
	getId(): number;

	/**
	 * Get the channel name.
	 * @return The channel name
	 */
	getName(): string;

	/**
	 * Get the server the channel is existing on.
	 * @return The server of the channel
	 */
	getServer(): IServer;

	/**
	 * Get messages sent in the channel.
	 * @param amount - The amount of messages to get
	 * @return A promise which returns an array of the messages on resolve
	 */
	getMessages(amount: number): Promise<IMessage[]>;

	/**
	 * Delete every message in an array of messages.
	 * @param MessagesToDelete - The messages which shall be deleted
	 */
	deleteMessages(MessagesToDelete: IMessage[]): Promise<IMessage[]>;

	/**
	 * Resolves with a collection of messages that pass the specified filter.
	 * @param options - Optional options to pass to the internal collector
	 */
	awaitMessages(options?: object): Promise<IMessage[]>;
}