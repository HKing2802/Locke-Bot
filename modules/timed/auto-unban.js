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

// sql prepared statements
const deleteBanStatement = db
    .getSessionSchema()
    .getTable('temp_ban')
    .delete()
    .where('user_id = :id');

let HAS_PENDING_UNBAN = false;
let BANNED = false;

/**
 * Callback method to perform the unban and remove enttry from database
 * @param {Client} client The client of the bot
 * @param {string} userID The ID of the user to unban
 * @returns {boolean}
 */
async function unban(client, userID) {
    // updates flags
    HAS_PENDING_UNBAN = false;
    BANNED = true;

    // removes entry from database
    await deleteBanStatement
        .bind('id', userID)
        .execute()
        .catch(err => {
            log(`Error in deleting Temp Ban entry: ${err}`, client, false, 'error');
        });

    // emits update event to set up the next pending unban
    unbanEvents.emit('update');

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
    let unbanned = false

    // gets info from db
    await db
        .getSessionSchema()
        .getTable('temp_ban')
        .select(['user_id', 'time_unban'])
        .orderBy('time_unban ASC')
        .limit(1)
        .execute(async result => {
            // calculates time to unban in ms
            const unbanTime = moment(result[1]).add(5, 'h');
            timeoutTime = unbanTime.diff(moment());

            if (timeoutTime > 1000) {
                // switches flag
                HAS_PENDING_UNBAN = true;
                BANNED = false;

                // sets up timeout
                toObject = setTimeout(() => {
                    unban(client, result[0]);
                }, timeoutTime);
            } else {
                // unmutes if threshold has already passed
                await unban(client, result[0]);
                unbanned = true;
            }
        })
        .catch(err => { log(`Error in setting up unban timer: ${err}`, client, false, 'error') });

    // returns the time and timeout object
    return { time: timeoutTime, obj: toObject, unbanned: unbanned };
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
        data = await setupUnban(client);
    } while (data.unbanned === true);
    return data
}

/**
 * Creates events handlers to handle updates to the pending unban and stopping the module
 * @param {Client} client The client of the bot
 */
async function controller(client) {
    let nextTimeout = await updateUnban(client, null).obj;

    unbanEvents.on('update', async () => {
        // force updates the next unban timeout
        nextTimeout = await updateUnban(client, nextTimeout).obj;
    });
    unbanEvents.once('stopModule', () => {
        // clears timer and removes listeners for a clean exit
        HAS_PENDING_UNBAN = false;
        BANNED = false
        clearTimeout(nextTimeout);
        unbanEvents.removeAllListeners();
    });
}

function getStatus() {
    return BANNED;
}

function getPending() {
    return HAS_PENDING_UNBAN;
}

/**
 * function to stop the module
 */
async function stop() {
    // emits event to stop module
    unbanEvents.emit('stopModule');
}

exports.main = controller;
exports.events = unbanEvents;
exports.stop = stop;
exports.testing = {
    unban: unban,
    setupUnban: setupUnban,
    updateUnban: updateUnban,
    controller: controller,
    getPending: getPending,
    getStatus: getStatus
}