const { Client } = require('discord.js');
const auth = require('../auth.json');
require('hjson/lib/require-config');
const { sweep } = require('../modules/timed/dbGarbageCollection.js');
const config = require('../config.hjson');
const db = require('./db.js');
const { log } = require('./util.js');
const moduleHandler = require('./module_handler.js');


function bot_init() {
    // bot login
    const client = new Client();
    client.login(auth.token);

    client.once('ready', async () => {
        log(`------------------------------------------------------------------`, client, false);
        log(`Logged in as ${client.user.tag}`, client, false);
        
        // Connect to Database
        db.connect()
            .then(async () => {
                // startup garbage collection
                await sweep(client);

                // initializes modules
                const modules = moduleHandler.getModules(config.modules);
                const started = await moduleHandler.startModules(modules, client);
                log(`${started}/${modules.size} Modules Initialized. Startup complete`, client, false);
            })
            .catch(err => { log(`Error in connecting to Database: ${err}`, client, false, 'error') });
    });
}

async function shutdown() {
    //const endprocess = require('../commands/endprocess.js');
    endprocess.events.emit('end');
}

exports.init = bot_init;
exports.shutdown = shutdown;