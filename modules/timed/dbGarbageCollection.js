/* Module to sweep through database tables and remove unneccesary entries
 */
const config = require('../../config.json');
const db = require('../../src/db.js');
const { log } = require('../../src/util.js');
const moment = require('moment');
const { Client } = require('discord.js');

/**
 * Checks the messages table for delted messages past the threshold
 * Returns the number of messages deleted
 * @param {Client} [client] The client for logging. Logs to console only if undefined
 * @returns {number}
 */
async function checkMessages(client) {
    // gets the threshold time in ms
    const threshold = moment().subtract(config.messageThreshold.num, config.messageThreshold.unit);

    // gets the data
    let delIDs = [];
    return db.buildQuery(`SELECT * FROM messages`)
        .execute(result => {
            // checks time against threshold
            if (+moment(result[2]) < +threshold) {
                // saves to array for logging purposes
                delIDs.push(result[0]);
            }
        })
        .then(async function () {
            // loops through ids and deletes them
            for (let id of delIDs) {
                await db.buildQuery(`DELETE FROM messages WHERE id = ${id} LIMIT 1`).execute()
                    .catch(err => { log(`Error in message delete: ${err}`, client, false, 'error') });

            }
            // logs and returns number of deleted messages
            log(`Deleted ${delIDs.length} Messages older than ${threshold.toNow(true)}`, client, false);
            return delIDs.length;
        })
        .catch(err => { log(`Error in message query: ${err}`, client, false, 'error') });
}

/**
 * Checks the edits table for edits with a deleted message
 * Returns the number of edits deleted
 * @param {Client} client The client for logging. Logs to console only if undefined
 * @returns {boolean}
 */
async function checkEdits(client) {
    // get all edits
    // delete any where message no longer exists
}

/**
 * Checks the muted_users table for users no longer muted or not in the server
 * Returns the number of entries deleted
 * @param {Client} [client] The client for logging. Logs to console only if undefined
 * @returns {number}
 */
async function checkMuted(client) {
    // get all muted users
    // check all users for if they're still muted and removes otherwise
}

/**
 * Checks the temp_ban table for users no longer banned
 * Returns the number of entries deleted
 * @param {Client} [client] The client for logging. Logs to console only if undefined
 * @returns {number}
 */
async function checkBanned(client) {
    // get all temp banned users
    // check if still banned and remove otherwise
}

/**
 * Runs the collection for each table
 * @param {Client} client The client for logging. Logs to console only if undefined
 * @returns {boolean}
 */
async function sweep(client) {
    log(`Starting Garbage collection...`, client, false);
    if (!db.connected()) {
        log('Database not connected', client, false, 'error');
        return false;
    } else {
        await checkMessages(client);
        await checkEdits(client);
        await checkMuted(client);
        await checkBanned(client);
        log(`Garbage collection complete.`, client, false);
        return true
    }
}

/**
 * Starts the timed portion of this module
 */
function startModule() {
    // starts timeout for sweep
}

exports.main = startModule;
exports.sweep = sweep;
exports.testing = {
    messages: checkMessages,
    edits: checkEdits,
    muted: checkMuted,
    banned: checkBanned
}