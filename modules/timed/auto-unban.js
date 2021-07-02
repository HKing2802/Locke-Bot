/* Module to sweep through temporarily banned users database and unban where necessary
 */
require('hjson/lib/require-config');
const config = require('../../config.hjson');
const db = require('../../src/db.js');
const events = require('events');
const moment = require('moment');
const { Client } = require('discord.js');
const { log } = require('../../src/util.js');

const unbanEvents = new events();

let HAS_PENDING_UNBAN = false;
let BANNED = false;

/**
 * Callback method to perform the unban and remove enttry from database
 * @param {Client} client The client of the bot
 * @param {string} userID The ID of the user to unban
 * @returns {boolean}
 */
async function unban(client, userID) {
    // updates flags and emits event to update the next pending unban
    HAS_PENDING_UNBAN = false;
    BANNED = true;
    unbanEvents.emit('update');

    // removes entry from database
    await db.buildQuery(`DELETE FROM temp_ban WHERE user_id = ${userID}`).execute();

    // performs unban
    const guild = client.guilds.cache.get(config.guildID);
    const target = await client.users.fetch(userID);

    if (!guild || !target) return false;
    else {
        await guild.members.unban(target, `LockeBot auto-unban`);
        return true;
    }
}

/**
 * Sets up the timeout of the unban
 * @param {Client} client The client of the bot
 * @param {string} userID The ID of the user to unban
 * @returns {Object<number, NodeJS.Timeout>}
 */
async function setupUnban(client, userID) {
    let timeoutTime;
    let toObject;

    // gets info from db
    await db.buildQuery(`SELECT time_unban FROM temp_ban WHERE user_id = ${userID}`)
        .execute(async result => {
            // calculates time to unban in ms
            const unbanTime = moment(result[0]).add(5, 'h');
            timeoutTime = unbanTime.diff(moment());

            if (timeoutTime > 0) {
                // switches flag
                HAS_PENDING_UNBAN = true;
                BANNED = false;

                // sets up timeout
                toObject = setTimeout(() => {
                    unban(client, userID);
                }, timeoutTime);
            } else {
                // unmutes if threshold has already passed
                await unban(client, userID);
            }
        })
        .catch(err => { log(`Error in setting up unban timer: ${err}`, client, false, 'error') });

    // returns the time and timeout object
    return { time: timeoutTime, obj: toObject };
}

/**
 * Updates the pending unban timeout
 * @param {Client} client The client of the bot
 * @param {NodeJS.Timeout} nextTimeout The timeout object of the pending unban
 * @returns {Object<number, NodeJS.Timeout>}
 */
async function updateUnban(client, nextTimeout) {
    clearTimeout(nextTimeout);
    let data;
    do {
        nextUser = await getNextUnban();
        if (!nextUser) return;
        data = await setupUnban(client, nextUser);
    } while (data.obj === undefined);
    return data
}

/**
 * Creates events handlers to handle updates to the pending unban and stopping the module
 * @param {Client} client The client of the bot
 * @param {NodeJS.Timeout} startTimeout The starting timeout for the next unban
 */
function controller(client, startTimeout) {
    let nextTimeout = startTimeout;

    unbanEvents.on('update', () => {
        // force updates the next unban timeout
        updateUnban(client, nextTimeout);
    });
    unbanEvents.on('stopModule', () => {
        // clears timer and removes listeners for a clean exit
        HAS_PENDING_UNBAN = false;
        BANNED = false
        clearTimeout(nextTimeout);
        unbanEvents.removeAllListeners();
    });
}

/**
 * Gets the next user ID needed to be unbanned from the database
 * @returns {string}
 */
async function getNextUnban() {
    let user;
    let time;
    await db.buildQuery(`SELECT user_id, time_unban FROM temp_ban`)
        .execute(result => {
            if (result[1] != null) {
                if (time === undefined || result[1] < time) {
                    user = result[0];
                    time = result[1];
                }
            }
        })
        .catch(err => { throw err });
    return user;
}

function getStatus() {
    return BANNED;
}

function getPending() {
    return HAS_PENDING_UNBAN;
}

/**
 * Initializes the module
 * Checks databse for any users needed to be unbanned and sets up controller with the next unban timeout if present
 * @param {Client} client The client of the bot
 */
async function initialize(client) {
    let nextUser;
    let nextTime;
    await db.buildQuery(`SELECT user_id, time_unban FROM temp_ban`)
        .execute(result => {
            if (result[1] != null) {
                const tu = moment(result[1]).add(5, 'h');
                if (tu.diff(moment()) < 1000) {
                    // unbans if below threshold
                    unban(client, result[0]);
                } else {
                    if (nextTime === undefined || result[2] < +nextTime) {
                        nextTime = tu;
                        nextUser = result[0];
                    }
                }
            }
        })
        .catch(err => { log(`Error in auto-unban initialization: ${err}`, client, false, 'error') });

    if (nextUser !== undefined) {
        // starts the next unban timer and starts the controller with it
        const data = await setupUnban(client, nextUser);
        controller(client, data.obj);
    } else {
        // starts the controller
        controller(client);
    }
}

/**
 * function to stop the module
 */
async function stop() {
    // emits event to stop module
    unbanEvents.emit('stopModule');
}

exports.main = initialize;
exports.events = unbanEvents;
exports.stop = stop;
exports.testing = {
    unban: unban,
    setupUnban: setupUnban,
    updateUnban: updateUnban,
    controller: controller,
    getNextUnban: getNextUnban,
    getPending: getPending,
    getStatus: getStatus
}