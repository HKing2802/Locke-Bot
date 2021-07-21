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
    // updates flag
    HAS_PENDING_UNMUTE = false;

    // removes entry from database
    await db
        .getSessionSchema()
        .getTable('muted_users')
        .delete()
        .where('user_id = :id')
        .bind('id', userID)
        .execute()
        .catch(err => {
            log(`Error in deleting muted user entry: ${err}`, client, false, 'error');
        });

    // emits update event to set up the next pending unmute
    unmuteEvents.emit('update');

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
 * @returns {Object<number, NodeJS.Timeout>}
 */
async function setupUnmute(client) {
    // gets info from db
    return db
        .getSessionSchema()
        .getTable('muted_users')
        .select(['user_id', 'time_unmute', 'member'])
        .orderBy('time_unmute ASC')
        .execute()
        .then(async results => {
            let result;
            while (result = results.fetchOne()) {
                if (result[1] === null) { continue }

                // calculates time to unmute in ms
                const unmuteTime = moment(result[1]).add(4, 'h');
                timeoutTime = unmuteTime.diff(moment());

                if (timeoutTime > 1000) {
                    // switches flags
                    UNMUTED = false;
                    HAS_PENDING_UNMUTE = true;

                    // sets up timeout
                    toObject = setTimeout(() => {
                        unmute(client, result[0], Boolean(result[2]));
                    }, timeoutTime);

                    // returns the time and the timeout object
                    return { time: timeoutTime, obj: toObject };
                } else {
                    // unmutes if threshold has already passed
                    await unmute(client, result[0], Boolean(result[2]));
                }
            }
        })
        .catch(err => { log(`Error in setting up unmute timer: ${err}`, client, false, 'error') });
}

/**
 * Updates the unmute timer
 * @param {Client} client The client of the bot
 * @param {NodeJS.Timeout} nextTimeout The timeout object for the next unmute
 * @returns {Object<number, NodeJS.Timeout>}
 */
async function updateUnmute(client, nextTimeout) {
    clearTimeout(nextTimeout);
    return await setupUnmute(client);
}

/**
 * Controls the module and handles changes to the next unmute time
 * @param {Client} client The client of the bot
 */
async function controller(client) {
    let nextTimeout = await updateUnmute(client, null).obj;

    unmuteEvents.on('update', async () => {
        // updates the next unmute timeout 
        nextTimeout = await updateUnmute(client, nextTimeout).obj;
    });
    unmuteEvents.once('stopModule', () => {
        // clears timer and removes listeners for clean exit
        HAS_PENDING_UNMUTE = false;
        UNMUTED = false;
        clearTimeout(nextTimeout);
        unmuteEvents.removeAllListeners();
    });
}

function getStatus() {
    return UNMUTED;
}

function getPending() {
    return HAS_PENDING_UNMUTE;
}

/**
 * Function to stop the module
 */
async function stop() {
    // emits the event to stop the module
    unmuteEvents.emit('stopModule');
}

exports.main = controller;
exports.events = unmuteEvents;
exports.stop = stop;
exports.testing = {
    unmute: unmute,
    controller: controller,
    setupUnmute: setupUnmute,
    getStatus: getStatus,
    updateUnmute: updateUnmute,
    getPending: getPending
}