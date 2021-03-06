/* Module to sweep through the muted users database and unmute when necessary
 */
require('hjson/lib/require-config');
const config = require('../../config.hjson');
const db = require('../../src/db.js');
const events = require('events');
const moment = require('moment');
const { Client } = require('discord.js');
const { log } = require('../../src/util.js');

const unmuteEvents = new events();

let UNMUTED = false;
let HAS_PENDING_UNMUTE = false;

/**
 * Performs the unmute on the member
 * @param {Client} client The client of the bot to work on
 * @param {number} userID The ID of the user to unmute
 * @param {boolean} member The boolean if the member had the member role
 * @returns {boolean}
 */
async function unmute(client, userID, member) {
    // updates flag and emits event to update the next pending unmute
    HAS_PENDING_UNMUTE = false;
    unmuteEvents.emit('update');

    // removes entry from database
    await db.buildQuery(`DELETE FROM muted_users WHERE user_id = ${userID}`).execute();

    // performs unmute
    const target = client.guilds.cache.get(config.guildID).members.cache.get(userID);
    if (!target) return false;
    else {
        if (target.roles.cache.has(config.humanRoleID)) return false;
        else {
            UNMUTED = true;
            await target.roles.remove(config.mutedRoleID);
            await target.roles.add(config.humanRoleID);
            if (member) await target.roles.add(config.memberRoleID);
            return true;
        }
    }
}

/**
 * Sets up the Timeout for the next unmute
 * @param {Client} client The client of the bot
 * @param {number} userID The ID of the user to unmute
 * @returns {Object<number, NodeJS.Timeout>}
 */
async function setupUnmute(client, userID) {
    let timeoutTime;
    let toObject;

    // gets info from db
    await db.buildQuery(`SELECT member, time_unmute FROM muted_users where user_id = ${userID}`)
        .execute(async result => {
            // calculates time to unmute in ms
            const unmuteTime = moment(result[1]).add(5, 'h');
            timeoutTime = unmuteTime.diff(moment());

            if (timeoutTime > 0) {
                // switches flags
                UNMUTED = false;
                HAS_PENDING_UNMUTE = true;

                // sets up timeout
                toObject = setTimeout(() => {
                    unmute(client, userID, Boolean(result[0]));
                }, timeoutTime);
            } else {
                // unmutes if threshold has already passed
                await unmute(client, userID, Boolean(result[0]));
            }
        })
        .catch(err => { log(`Error in setting up unmute timer: ${err}`, client, false, 'error') });

    // returns the time and the timeout object
    return { time: timeoutTime, obj: toObject };
}

/**
 * Updates the unmute timer
 * @param {Client} client The client of the bot
 * @param {NodeJS.Timeout} nextTimeout The timeout object for the next unmute
 * @returns {Object<number, NodeJS.Timeout>}
 */
async function updateUnmute(client, nextTimeout) {
    clearTimeout(nextTimeout);
    let data;
    do {
        // iterates until setUnmute produces the timeout object
        nextUser = await getNextUnmute();
        if (!nextUser) return;
        data = await setupUnmute(client, nextUser);
    } while (data.obj === undefined);
    return data;
}

/**
 * Controls the module and handles changes to the next unmute time
 * @param {Client} client The client of the bot
 * @param {NodeJS.Timeout} startTimeout The timeout object of the next unmute
 */
function controller(client, startTimeout) {
    let nextTimeout = startTimeout;

    unmuteEvents.on('update', () => {
        // updates the next unmute timeout 
        updateUnmute(client, nextTimeout);
    });
    unmuteEvents.once('stopModule', () => {
        // clears timer and removes listeners for clean exit
        log('Stopping auto-unmute module...', client, false);
        HAS_PENDING_UNMUTE = false;
        UNMUTED = false;
        clearTimeout(nextTimeout);
        unmuteEvents.removeAllListeners();
    });
}

/**
 * Gets the next userID that needs to be unmuted from the database
 * @returns {Promise<number>|undefined}
 */
async function getNextUnmute() {
    let user;
    let time;
    await db.buildQuery(`SELECT user_id, time_unmute FROM muted_users`)
        .execute(result => {
            if (result[1] != null) {
                if (result[1] < time) {
                    // saves if result is less than stored time
                    user = result[0];
                    time = result[1];
                } else if (time === undefined) {
                    // saves if time is undefined
                    user = result[0];
                    time = result[1];
                }
            }
        })
        .catch(err => { throw err });
    return user;
}

function getStatus() {
    return UNMUTED;
}

function getPending() {
    return HAS_PENDING_UNMUTE;
}

/**
 * Initializes the module
 * Unmutes any members as necessary and determines the next member to unmute, then starts the controller
 * @param {Client} client The client of the bot
 */
async function initialize(client) {
    let nextUser;
    let nextTime;
    await db.buildQuery(`SELECT user_id, member, time_unmute FROM muted_users`)
        .execute(result => {
            if (result[2] != null) {
                const tu = moment(result[2]).add(5, 'h');
                if (tu.diff(moment()) < 1000) {
                    // unmutes if below threshold
                    unmute(client, result[0], Boolean(result[1]));
                } else {
                    // saves user id for next timer
                    if (nextTime === undefined) {
                        nextTime = tu;
                        nextUser = result[0];
                    } else if (result[2] < +nextTime) {
                        nextTime = tu;
                        nextUser = result[0];
                    }
                }
            }
        })
        .catch(err => { log(`Error in auto-unmute initialization: ${err}`, client, false, 'error') });

    if (nextUser !== undefined) {
        // starts the next unmute timer and starts the controller with it
        const data = await setupUnmute(client, nextUser);
        controller(client, data.obj);
    } else {
        // starts the controller
        controller(client);
    }
}

/**
 * Function to stop the module
 */
async function stop() {
    // emits the event to stop the module
    unmuteEvents.emit('stopModule');
}

exports.main = initialize;
exports.events = unmuteEvents;
exports.stop = stop;
exports.testing = {
    unmute: unmute,
    getNextUnmute: getNextUnmute,
    controller: controller,
    setupUnmute: setupUnmute,
    getStatus: getStatus,
    updateUnmute: updateUnmute,
    getPending: getPending
}