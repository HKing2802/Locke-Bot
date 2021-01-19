/* Module to sweep through the muted users database and unmute when necessary
 */
require('hjson/lib/require-config');
const config = require('../../config.hjson');
const db = require('../../src/db.js');
const events = require('events');
const moment = require('moment');
const { Client } = require('discord.js');

class unmuteEvents extends events {}

/**
 * Performs the unmute on the member
 * @param {Client} client The client of the bot to work on
 * @param {number} userID The ID of the user to unmute
 * @param {boolean} member The boolean if the member had the member role
 * @returns {boolean}
 */
async function unmute(client, userID, member) {
    // callback function for checking and unmuting a member
    // should be vaguely similar to unmute command

    const target = client.guilds.cache.get(config.guildID).members.cache.get(userID);
    if (!target) return false;
    else {
        if (target.roles.cache.has(config.humanRoleID)) return false;
        else {
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
 * @returns {Array<number, NodeJS.Timeout>}
 */
async function setupUnmute(client, userID) {
    // sets up timer for unmute
    // queries db and calculates time
    // may be integrated into controller and use getNextUnmute
    // returns timeout object

    return db.buildQuery(`SELECT member, time_unmute FROM muted_users where user_id = ${userID}`)
        .execute(async result => {
            const unmuteTime = moment(result[1]);
            const timeoutTime = unmuteTime.diff(moment());

            if (timeoutTime > 0) {
                const toObject = setTimeout(() => {
                    unmute(client, userID, Boolean(result[0]));
                }, timeoutTime)
                return [timeoutTime, toObject];
            } else {
                await unmute(client, userID, Boolean(result[0]));
                const nextUser = getNextUnmute();
                return setupUnmute(client, nextUser);
            }
        })
        .catch(err => { throw err });
}

/**
 * Controls the unmute module and handles changes to the next unmute time
 * @param {Client} client The client of the bot
 * @param {NodeJS.Timeout} startTimeout The timeout object of the next unmute
 * @param {number} startUser The id of the next user to unmute
 * @param {Moment} startTime The moment object of the time the next unmute happens
 * @returns {undefined}
 */
async function controller(client, startTimeout, startUser, startTime) {
    // stores next timer object
    // sets up listener for timed mute event
    // sets up listener for garbage collection event
    // on either event recheck next unmute time

    let nextTimeout = startTimeout;     // timeout object
    let nextUser = startUser;           // number userID
    let nextTime = startTime;           // moment object

    unmuteEvents.on('mute', (muteTime) => {
        // muteTime should be a moment object

        if (muteTime.diff(nextTime) < 0) {
            clearTimeout(nextTimeout);
            nextUser = getNextUnmute();
            const data = setupUnmute(client, nextUser);
            nextTime = data[0];
            nextTimeout = data[1];
        }
    });
    unmuteEvents.on('garbageCollection', () => {
        const newUser = getNextUnmute();
        if (newUser !== nextUser) {
            clearTimeout(nextTimeout);
            nextUser = newUser;
            const data = setupUnmute(client, nextUser);
            nextTime = data[0];
            nextTimeout = data[1];
        }
    });
}

/**
 * Gets the next userID that needs to be unmuted from the database
 * @returns {number}
 */
function getNextUnmute() {
    // function to query database for next unmute
    // returns user ID of next unmute

    let user;
    let time;
    return db.buildQuery(`SELECT user_id, time_unmute FROM muted_users`)
        .execute(result => {
            if (result[1] != null) {
                if (result[1] < time) {
                    user = result[0];
                    time = result[1];
                }
            }
        })
        .then(() => {
            return user;
        })
        .catch(err => { throw err });
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
exports.testing = {
    unmute: unmute,
    getNextUnmute: getNextUnmute,
    controller: controller,
    setupUnmute: setupUnmute
}