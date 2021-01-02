const mysqlx = require('@mysql/xdevapi');
const auth = require('../auth.json');
const { log } = require('../src/util.js');
const moment = require('moment');

let CONNECTED = false;
let session;

const db_config = {
    host: auth.db_host,
    user: auth.db_user,
    password: auth.db_pass,
    schema: 'lockebot_test_db',
    port: 33060
};

/**
 * Connects to the database
 * @returns {mysql.database}
 */
function db_connect() {
    return mysqlx.getSession(db_config)
        .then(s => {
            CONNECTED = true;
            log('Connected to database');
            session = s;
            return s;
        })
        .catch(err => {
            log(`Could not connect to Database: ${err}`, undefined, false, 'error');
            return;
        });
}

/**
 * Disconnects from the database
 */
function db_disconnect() {
    try {
        session.close();
        log('Disconnected from Database');
        CONNECTED = false;
    } catch(error) {
        log('Could not disconnect from Database: ${error}', undefined, false, 'error');
    }
}

function buildQuery(query) {
    if (!CONNECTED) throw Error('Not connected to a Database');
    return session.sql(query);
}

function load_del_msg(message) {
    if (!CONNECTED) db_connect();
    const data = {
        user_id: messsage.author.id,
        message: message.content,
        edits_id: message.id
    };
    con.query(`INSERT INTO messages SET ?`, data, function(err, result) {
        if (err) throw err;
    });

    let edit_num = 1;
    for (const edit of message.edits) {
        const edit_data = {
            id: edit.id,
            num: edit_num,
            time: moment.format('YYYY-MM-DD HH:mm:ss'),
            content: edit.content
        };
        con.query(`INSERT INTO edits SET ?`, edit_data, function (err, result) {
            if (err) throw err;
        });
        edit_num += 1;
    }
}

exports.connect = db_connect;
exports.disconnect = db_disconnect;
exports.connected = CONNECTED;
exports.session = session;
exports.load_del_msg = load_del_msg;