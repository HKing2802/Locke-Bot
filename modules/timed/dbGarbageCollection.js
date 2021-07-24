/* Module to sweep through database tables and remove unneccesary entries
 */
const config = require('../../src/config.js');
const db = require('../../src/db.js');
const { log, sleep } = require('../../src/util.js');
const moment = require('moment');
const { Client } = require('discord.js');
const auto_unmute = require('./auto-unmute.js');
const auto_unban = require('./auto-unban.js');
const events = require('events');

const moduleEvents = new events();

/**
 * Checks the messages table for delted messages past the threshold
 * Returns the number of messages deleted
 * @param {Client} [client] The client for logging. Logs to console only if undefined
 * @returns {number}
 */
async function checkMessages(client) {
    // gets the threshold time in ms
    const threshold = moment().subtract(config.getConfig('messageThreshold').num, config.getConfig('messageThreshold').unit);

    // gets the data
    let delIDs = [];
    return db
        .getSessionSchema()
        .getTable('messages')
        .select(['id', 'send_time'])
        .execute(result => {
            // checks time against threshold
            if (+moment(result[1]) < +threshold) {
                // saves to array for logging purposes
                delIDs.push(result[0]);
            }
        })
        .then(async function () {
            // loops through ids and deletes them
            for (let id of delIDs) {
                await db
                    .getSessionSchema()
                    .getTable('messages')
                    .delete()
                    .where('id = :id')
                    .limit(1)
                    .bind('id', id)
                    .execute()
                    .catch(err => { log(`Error in message delete: ${err}`, client, false, 'error') });

            }
            // logs and returns number of deleted messages
            log(`Deleted ${delIDs.length} Messages older than ${threshold.toNow(true)}`, client, false);
            return delIDs.length;
        })
        .catch(err => { log(`Error in message query: ${err}`, client, false, 'error') });
}

/**
 * Checks the edits table for edits with a deleted message. Should be run after Message garbage collection
 * Returns the number of edits deleted
 * @param {Client} client The client for logging. Logs to console only if undefined
 * @returns {number}
 */
async function checkEdits(client) {
    // gets and counts all edits without a matching message
    let numDel = 0;
    await db.buildQuery(`SELECT edits.* FROM edits LEFT JOIN messages ON edits.msg_id = messages.id WHERE messages.id IS NULL`)
        .execute(result => {
            numDel += 1;
        })
        .catch(err => { log(`Error in edits query: ${err}`, client, false, 'error') });

    // Deletes all edits without a matching message
    await db.buildQuery(`DELETE edits FROM edits LEFT JOIN messages ON edits.msg_id = messages.id WHERE messages.id IS NULL`).execute()
        .catch(err => { log(`Error in edits delete query: ${err}`, client, false, 'error') });

    // logs and returns number of deleted edits
    log(`Deleted ${numDel} Edits without a parent message`, client, false);
    return numDel;
}

/**
 * Checks the muted_users table for users no longer muted or not in the server
 * Returns the number of entries deleted
 * @param {Client} client The client for logging and getting muted status
 * @returns {number}
 */
async function checkMuted(client) {
    // gets guild to check if muted
    const guild = client.guilds.cache.get(config.getConfig('guildID'));
    if (!guild) {
        log(`Error in getting guild: No such ID ${config.getConfig('guildID')}`, client, false, 'error');
        return;
    }

    // checks all members if still muted
    let delIDs = [];
    await db
        .getSessionSchema()
        .getTable('muted_users')
        .select(['user_id'])
        .execute(result => {
            // gets member object from guild
            let member = guild.members.cache.get(result[0]);
            if (!member) {
                // member no longer in guild
                delIDs.push(result[0]);
            } else {
                // if member has been unmuted
                if (!(member.roles.cache.has(config.getConfig('mutedRoleID')))) delIDs.push(result[0]);
            }
        })
        .catch(err => { log(`Error in muted_users query: ${err}`, client, false, 'error') });

    // deletes entries from table
    for (let id of delIDs) {
        await db
            .getSessionSchema()
            .getTable('muted_users')
            .delete()
            .where('user_id = :id')
            .limit(1)
            .bind('id', id)
            .execute()
            .catch(err => { log(`Error in muted_users delete query: ${err}`, client, false, 'error') });
    }

    // updates auto-unmute module
    auto_unmute.events.emit('update');

    // logs and returns number of deleted entries
    log(`Deleted ${delIDs.length} Members from muted table`, client, false);
    return delIDs.length;
}

/**
 * Checks the temp_ban table for users no longer banned
 * Returns the number of entries deleted
 * @param {Client} client The client for logging and getting banned status
 * @returns {number}
 */
async function checkBanned(client, guild) {
    // gets guild to check if banned
    if (!guild) guild = client.guilds.cache.get(config.getConfig('guildID'));
    if (!guild) {
        log(`Error in getting guild: No such ID ${config.getConfig('guildID')}`, client, false, 'error');
        return;
    }
    
    // gets entries and check if banned
    let delIDs = [];
    await db
        .getSessionSchema()
        .getTable('temp_ban')
        .select('user_id')
        .execute(async result => {
            let banned = await guild.fetchBan(result[0].toString());
            if (banned === undefined) delIDs.push(result[0]);
        })
        .catch(err => { log(`Error in temp_ban query: ${err}`, client, false, 'error') });

    // deletes entries from table
    for (let id of delIDs) {
        await db
            .getSessionSchema()
            .getTable('temp_ban')
            .delete()
            .where('user_id = :id')
            .limit(1)
            .bind('id', id)
            .execute()
            .catch(err => { log(`Error in temp_ban delete query: ${err}`, client, false, 'error') });
    }

    // updates auto-unban module
    auto_unban.events.emit('update');

    // logs and returns number of deleted entries
    log(`Deleted ${delIDs.length} Users from temp ban table`, client, false);
    return delIDs.length;
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
 * Controller to start and store the sweep interval and set up the listener to stop the module
 * @param {number} startTime Time in ms between sweeps
 */
async function controller(startTime) {
    const interval = setInterval(sweep, startTime);
    interval.unref();

    moduleEvents.once('stopModule', () => {
        clearInterval(interval);
    });
}

/**
 * Starts the timed portion of the module
 */
function startModule() {
    // starts timed interval for sweep
    const msTime = config.getConfig('gcSweepInterval') * 60 * 60 * 1000;
    controller(msTime);
}

/**
 * Function to stop the module
 */
function stopModule() {
    // emits the event to stop the module
    moduleEvents.emit('stopModule');
}

exports.main = startModule;
exports.sweep = sweep;
exports.stop = stopModule;
exports.testing = {
    messages: checkMessages,
    edits: checkEdits,
    muted: checkMuted,
    banned: checkBanned,
    controller: controller,
    events: moduleEvents
}