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

/**
 * Performs the unmute on the member
 * @param {Client} client The client of the bot to work on
 * @param {number} userID The ID of the user to unmute
 * @param {boolean} member The boolean if the member had the member role
 * @returns {boolean}
 */
async function unmute(client, userID, member) {
    await db.buildQuery(`DELETE FROM muted_users WHERE user_id = ${userID}`).execute();

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
    await db.buildQuery(`SELECT member, time_unmute FROM muted_users where user_id = ${userID}`)
        .execute(async result => {
            const unmuteTime = moment(result[1]).add(5, 'h');
            timeoutTime = unmuteTime.diff(moment());

            if (timeoutTime > 0) {
                UNMUTED = false;
                toObject = setTimeout(() => {
                    unmute(client, userID, Boolean(result[0]));
                }, timeoutTime);
            } else {
                await unmute(client, userID, Boolean(result[0]));
            }
        })
        .catch(err => { log(`Error in setting up unmute timer: ${err}`, client, false, 'error') });
    return { time: timeoutTime, obj: toObject };
}

/**
 * Updates the unmute timer
 * @param {Client} client The client of the bot
 * @param {NodeJS.Timeout} nextTimeout The timeout object for the next unmute
 * @returns {Object<number, NodeJS.Timeout>}
 */
async function updateUnmute(client, nextTimeout) {
    log('updating next unmute', client, false);
    clearTimeout(nextTimeout);
    let data;
    do {
        nextUser = await getNextUnmute();
        if (!nextUser) return;
        data = await setupUnmute(client, nextUser);
    } while (data.obj === undefined);
    return data;
}

/**
 * Controls the unmute module and handles changes to the next unmute time
 * @param {Client} client The client of the bot
 * @param {NodeJS.Timeout} startTimeout The timeout object of the next unmute
 */
function controller(client, startTimeout) {
    let nextTimeout = startTimeout;

    unmuteEvents.on('mute', () => {
        updateUnmute(client, nextTimeout);
    });
    unmuteEvents.on('garbageCollection', () => {
        updateUnmute(client, nextTimeout);
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
                    user = result[0];
                    time = result[1];
                } else if (time === undefined) {
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

/**
 * Initializes the module
 * Unmutes any members as necessary and determines the next member to unmute
 * @param {Client} client The client of the bot
 * @returns {undefined}
 */
async function initialize(client) {
    // initializes the module
    // checks muted users for any past threshold
    // performs unmutes as necessary
    // starts controller with starting data
}

exports.main = initialize;
exports.events = unmuteEvents;
exports.testing = {
    unmute: unmute,
    getNextUnmute: getNextUnmute,
    controller: controller,
    setupUnmute: setupUnmute,
    getStatus: getStatus,
    updateUnmute: updateUnmute
}