/* Module to handle deleted messages
 */
const db = require('../../src/db.js');
const { log } = require('../../src/util.js');
const moment = require('moment');

async function recordDeleted(message) {
    if (message.author.bot) return false;
    else {
        // inserts message to table
        if (!(db.connected())) {
            log('Could not log deleted message: Not connected to database', undefined, false, 'warn');
            return false;
        }
        const sendTime = moment(message.createdTimestamp).format('YYYY-MM-DD HH:mm:ss');
        db.getSessionSchema().getTable('messages')
            .insert(['id', 'user_id', 'channel_id', 'send_time', 'content'])
            .values(message.id, message.author.id, message.channel.id, sendTime, message.content)
            .execute()
            .catch(err => {
                log(`Error in deleted message database insertion: ${err}`, message.client, false, 'error');
            });

        // checks for and records edits
        if (message.edits) {
            for (let i = 1; i < message.edits.length; i++) {
                let editTime;
		editTime = i > 0 ? message.edits[i - 1].editedAt : message.editedAt;
                const editID = String(message.id) + String(i);
                db.getSessionSchema().getTable('edits')
                    .insert(['id', 'msg_id', 'num', 'edit_time', 'content'])
                    .values(editID, message.id, i, editTime, message.edits[i].content)
                    .execute()
                    .catch(err => {
                        log(`Error in deleted message edits insertion: ${err} || ${editID}`, message.client, false, 'error');
                    });
            }
        }

        let logmsg = "Logged Deleted Message";
        if (message.edits) logmsg += ` with ${message.edits.length - 1} Edits`;
        log(logmsg);
        return true;
    }
}

function main(client) {
    // sets up event listener
    client.on('messageDelete', (message) => {
        recordDeleted(message)
            .catch(err => {
                log(`Error in message Deletion event listener: ${err}`, client, true, 'error');
            })
    })
}

exports.main = main;
exports.testing = {
    recordDeleted: recordDeleted
}
