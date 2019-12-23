"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ErrorHandler_1 = require("../../src/utils/ErrorHandler");
const assert = require("assert");
const sinon = require("sinon");
describe("The class ErrorHandler", function () {
    describe("The method log", function () {
        beforeEach(function () {
            this.consoleStub = sinon.stub(console, "error");
        });
        afterEach(function () {
            this.consoleStub.restore();
        });
        it("Logs the given error message as error to the console", function () {
            //Arrange
            let errorMessage = "my error message";
            //Act
            ErrorHandler_1.ErrorHandler.log(errorMessage);
            //Assert
            assert.strictEqual(this.consoleStub.getCall(0).args[0], errorMessage, "The correct error message was logged.");
        });
        it("Logs the given error object to the console", function () {
            //Arrange
            let error = new Error("my error message");
            //Act
            ErrorHandler_1.ErrorHandler.log(error);
            //Assert
            assert.strictEqual(this.consoleStub.getCall(0).args[0], error, "The correct error object was logged.");
        });
    });
    describe("The method throwErrorMessage", function () {
        it("Converts the error message to an error object and throws it", function () {
            //Assert
            let errorMessage = "my error message";
            try {
                //Act
                ErrorHandler_1.ErrorHandler.throwErrorMessage(errorMessage);
            }
            catch (e) {
                //Assert
                assert.strictEqual(e.toString(), "Error: my error message", "The correct error was thrown.");
            }
        });
    });
    describe("The method throwError", function () {
        it("Throws the error object", function () {
            //Assert
            let error = new Error("my error message");
            try {
                //Act
                ErrorHandler_1.ErrorHandler.throwError(error);
            }
            catch (e) {
                //Assert
                assert.strictEqual(e, error, "The correct error was thrown.");
            }
        });
    });
});
//# sourceMappingURL=ErrorHandlerTest.js.map