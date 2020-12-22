
const mysql = require('mysql');
const auth = require('../auth.json');
const { log } = require('./util.js');

const CONNECTED = false;

// Database auth
const con = mysql.createConnection({
    host: auth.db_host,
    user: auth.db_user,
    password: auth.db_pass,
    database: 'lockebot_db'
});

/**
 * Connects to the database
 * @returns {mysql.database}
 */
function db_connect() {
    con.connect(function (err) {
        if (err) {
            log(`Could not connect to Database: ${err}`, undefined, false, "error");
            return;
        } else {
            log("Connected to Database");
            CONNECTED = true;
            return con;
        }
    })
}

/**
 * Disconnects from the database
 */
function db_disconnect() {
    con.end(function (err) {
        if (err) {
            log(`Could not disconnect from Database: ${err}`, undefined, false, "error");
        } else {
            log("Disconnected from Database");
            CONNECTED = false;
        }
    });
}

exports.connect = db_connect;
exports.disconnect = db_disconnect;
exports.connected = CONNECTED;
exports.con = con;