// Handler for all configs in LockeBot
// supports rebuilding configs

require('hjson/lib/require-config');
const { log } = require('./util.js');
const { Client } = require('discord.js');

// stored client for logging
let LOG_CLIENT;

let CONFIG_DATA;
let CONFIG_NAMES;

let LIVE_DATA;
let LIVE_DATA_NAMES;

/**
 * Clears and builds the stored Config data
 * Each property is immutable and not enumerable
 * Retains a list of names for quick checking if data exists
 * 
 * @private
 */
function buildConfigData() {
    CONFIG_DATA = new Object();
    CONFIG_NAMES = new Set();

    config = require("../config.hjson");

    for (let name of Object.getOwnPropertyNames(config)) {
        if (name === "liveDataFormat") { continue }
        if (CONFIG_NAMES.has(name)) { throw Error("Config has multiple entries of the same name"); }

        Object.defineProperty(CONFIG_DATA, name, {
            value: config[name],
            writable: false
        });

        CONFIG_NAMES.add(name);
    }

    Object.freeze(CONFIG_DATA);
    log("Initialized Config Data", LOG_CLIENT, false);
}

/**
 * Clears and builds the stored Live Data
 * Each property writable but cannot be deleted
 * Retains a list of names for quick checking if data exists
 * 
 * @private
 */
function buildLiveData() {
    LIVE_DATA = new Object();
    LIVE_DATA_NAMES = new Set();

    config = require("../config.hjson");

    for (let obj of config.liveDataFormat) {
        if (LIVE_DATA_NAMES.has(obj.name)) { throw Error("Live Data has multiple entries of the same name in format"); }


        Object.defineProperty(LIVE_DATA, obj.name, {
            value: obj.default,
            writable: true
        });

        LIVE_DATA_NAMES.add(obj.name);
    }

    Object.seal(LIVE_DATA);
    log("Initialized Live Data", LOG_CLIENT, false);
}

/**
 * Initializes the config module at startup
 * @param {Client} client
 */
function init(client) {
    LOG_CLIENT = client;

    buildConfigData();
    buildLiveData();
}

/**
 * Gets a config value from the config
 * @param {string} name The name of the config entry
 * @returns {any} The value of the config, or undefined on error reading
 */
function getConfig(name) {
    if (CONFIG_DATA === undefined || CONFIG_NAMES === undefined) {
        log("Config data not initialized on attempted read", LOG_CLIENT, false, 'error');
    } else if (!(CONFIG_NAMES.has(name))) {
        log(`Attempt to read nonexistent config data by name: \`${name}\``, LOG_CLIENT, false, 'warn');
    } else {
        return CONFIG_DATA[name];
    }
}

/**
 * Gets the value of a Live Data entry. 
 * Live Data is live editable configuration data, such as flags
 * @param {string} name The name of the entry
 * @returns {any} The value of the Live Data, or undefined on error reading
 */
function getLiveData(name) {
    if (LIVE_DATA === undefined || LIVE_DATA_NAMES === undefined) {
        log("Live Data not initialized on attempted read", LOG_CLIENT, false, 'error');
    } else if (!(LIVE_DATA_NAMES.has(name))) {
        log(`Attempted to read nonexistent live data by name: \`${name}\``, LOG_CLIENT, false, 'warn');
    } else {
        return LIVE_DATA[name];
    }
}

/**
 * Sets the value of a Live Data entry
 * Live Data is live editable configuration data, such as flags
 * @param {string} name The name of the entry
 * @param {any} value The value of the entry
 */
function setLiveData(name, value) {
    if (LIVE_DATA === undefined || LIVE_DATA_NAMES === undefined) {
        log("Live Data not initialized on attempted write", LOG_CLIENT, false, 'error');
    } else if (!(LIVE_DATA_NAMES.has(name))) {
        log(`Attempted to write to nonexistent live data by name: \`${name}\``, LOG_CLIENT, false, 'warn');
    } else {
        Object.defineProperty(LIVE_DATA, name, {
            value: value,
            writable: true
        });
    }
}

exports.initialize = init;
exports.rebuildConfig = buildConfigData;
exports.get = getConfig;
exports.liveData = {
    get: getLiveData,
    set: setLiveData
}