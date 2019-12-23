export class ErrorHandler {
	/**
	 * Prints the given error into the console without quitting the program
	 * @param error - The error which shall be logged in the console
	 */
	static log(error: string|Error): void {
		console.error(error);
	}

	/**
	 * Converts the given error message to an error, throws it and quits the program
	 * @param errorMessage - The message which shall be converted to an error object
	 */
	static throwErrorMessage(errorMessage: string): void {
		let error: Error = new Error(errorMessage);
		throw error;
	}

	/**
	 * Throws the given error and quits the program
	 * @param error - The error which shall be thrown
	 */
	static throwError(error: Error): void {
		throw error;
	}
}