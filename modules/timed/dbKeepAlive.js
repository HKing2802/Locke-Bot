// Module to restart the connection to the database to ensure constant connection

const config = require('../../src/config.js');
const { Client } = require('discord.js');
const db = require('../../src/db.js');
const { log } = require('../../src/util.js')
const events = require('events');

const moduleEvents = new events();


function restartDatabaseConnection(client) {
    log("Restarting Database Session...", client, false);

    db.disconnect()
        .then(() => {
            db.connect();
        }).then(() => {
            log("Session Restart Complete.", client, false);
        }).catch(err => {
            log(`Error in Database Session Restart: ${err}`, client, false);
        });
}

function start(client) {
    const msTime = config.getConfig('dbRestartInterval') * 60 * 60 * 1000;
    const interval = setInterval(restartDatabaseConnection, msTime, client);

    interval.unref;

    moduleEvents.once('stopModule', () => {
        clearInterval(interval);
    });
}

function stop() {
    moduleEvents.emit('stopModule');
}

exports.start = start;
exports.stop = stop;