const mysqlx = require('@mysql/xdevapi');
const auth = require('../auth.json');
const { log } = require('../src/util.js');
const SqlString = require('sqlstring');

let CONNECTED = false;
let session;

const db_config = {
    host: auth.db_host,
    user: auth.db_user,
    password: auth.db_pass,
    schema: 'lockebot_db',
    port: 33060
};

/**
 * Connects to the database
 * @param {Object} sessionConfig The configuration object to connect to the database
 * @param {string} sessionConfig.host The host address of the server
 * @param {string} sessionConfig.user The username of the client
 * @param {string} sessionConfig.password The password of the client
 * @param {string} sessionConfig.schema The database schema for the client to use
 * @param {number} sessionConfig.port The port of the connection
 */
async function db_connect(sessionConfig = db_config) {
    if (CONNECTED && session !== undefined) {
        log('Attempting to connect to database while already connected. Disconnecting...', undefined, false, 'warn');
        db_disconnect();
    }

    return mysqlx.getSession(db_config)
        .then(s => {
            CONNECTED = true;
            log('Connected to database');
            session = s;
            return;
        })
        .catch(err => {
            log(`Could not connect to Database: ${err}`, undefined, false, 'error');
            return;
        });
}

/**
 * Gets if the database is connected
 * @returns {boolean}
 */
function getConnected() {
    return CONNECTED;
}

/**
 * Disconnects from the database
 */
async function db_disconnect() {
    if (!CONNECTED) return;
    try {
        await session.close();
        log('Disconnected from Database');
        CONNECTED = false;
    } catch (error) {
        log('Could not disconnect from Database: ${error}', undefined, false, 'error');
    }
}

/**
 * Sanitizes and builds a SQL query with the connected database
 * Throws error if not connected to database, check if connected by checking db.connected;
 * @param {string} query The SQL query
 * @returns {mysqlx.SqlExecute}
 */
function buildQuery(query) {
    if (!CONNECTED) throw Error('Not connected to a Database');
    return session.sql(SqlString.format(query));
}

exports.connect = db_connect;
exports.disconnect = db_disconnect;
exports.buildQuery = buildQuery;
exports.connected = getConnected;