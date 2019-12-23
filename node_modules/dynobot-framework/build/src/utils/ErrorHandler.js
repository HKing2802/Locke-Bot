"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ErrorHandler {
    /**
     * Prints the given error into the console without quitting the program
     * @param error - The error which shall be logged in the console
     */
    static log(error) {
        console.error(error);
    }
    /**
     * Converts the given error message to an error, throws it and quits the program
     * @param errorMessage - The message which shall be converted to an error object
     */
    static throwErrorMessage(errorMessage) {
        let error = new Error(errorMessage);
        throw error;
    }
    /**
     * Throws the given error and quits the program
     * @param error - The error which shall be thrown
     */
    static throwError(error) {
        throw error;
    }
}
exports.ErrorHandler = ErrorHandler;
//# sourceMappingURL=ErrorHandler.js.map