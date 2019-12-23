"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DiscordClient_1 = require("./wrappers/discord/DiscordClient");
const ErrorHandler_1 = require("./utils/ErrorHandler");
const DiscordUser_1 = require("./wrappers/discord/DiscordUser");
const DiscordMessage_1 = require("./wrappers/discord/DiscordMessage");
const events_1 = require("events");
const EventWrapper_1 = require("./utils/EventWrapper");
const DiscordEventHandler_1 = require("./wrappers/discord/DiscordEventHandler");
const Discord = require("discord.js");
const client = new Discord.Client();
class DiscordBot {
    constructor(token) {
        this._apiEvents = {
            error: {
                name: "error",
                returnClass: Error,
                isWrapped: false,
                isInitEvent: false
            },
            serverMemberAdd: {
                name: "guildMemberAdd",
                returnClass: DiscordUser_1.DiscordUser,
                isWrapped: true,
                isInitEvent: false
            },
            serverMemberRemove: {
                name: "guildMemberRemove",
                returnClass: DiscordUser_1.DiscordUser,
                isWrapped: true,
                isInitEvent: false
            },
            message: {
                name: "message",
                returnClass: DiscordMessage_1.DiscordMessage,
                isWrapped: true,
                isInitEvent: false
            },
            ready: {
                name: "ready",
                returnClass: null,
                isWrapped: false,
                isInitEvent: true
            }
        };
        this._events = new events_1.EventEmitter();
        this._token = token;
    }
    onEvent(name, listener) {
        if (this._apiEvents.hasOwnProperty(name)) {
            let Event = new DiscordEventHandler_1.DiscordEventHandler(name, this._apiEvents);
            if (Event.isInitEvent()) {
                client.login(this._token).then(() => {
                    let eventWrapper = new EventWrapper_1.EventWrapper(client, this._events);
                    eventWrapper.registerEvents(this._apiEvents, true);
                    this._client = new DiscordClient_1.DiscordClient(client);
                    listener();
                }).catch((error) => {
                    ErrorHandler_1.ErrorHandler.throwError(error);
                });
            }
            else {
                this._events.on(name, listener);
            }
        }
        else {
            ErrorHandler_1.ErrorHandler.throwErrorMessage(`The event '${name}' is not supported.`);
        }
    }
    getClient() {
        if (this._client) {
            return this._client;
        }
        else {
            ErrorHandler_1.ErrorHandler.throwErrorMessage("The bot has not been initialized yet.");
        }
    }
}
exports.DiscordBot = DiscordBot;
//# sourceMappingURL=DiscordBot.js.map