const { Client } = require('discord.js');
const auth = require('../auth.json');
require('hjson/lib/require-config');
const config = require('../config.hjson');
const db = require('./db.js');
const { log, sleep } = require('./util.js');
const moduleHandler = require('./module_handler.js');
const { sweep } = require('../modules/timed/dbGarbageCollection.js');

let CLIENT;

function bot_init() {
    // bot login
    const client = new Client();
    client.login(auth.token);

    // Stores client for use in shutdown
    CLIENT = client;

    client.once('ready', async () => {
        log(`------------------------------------------------------------------`, client, false);
        log(`Logged in as ${client.user.tag}`, client, false);
        
        // Connect to Database
        await db.connect()
            .then(() => { log(`Connected to Database`, client, false) })
            .catch(err => { log(`Error in connecting to Database: ${err}`, client, false, 'error') });

        // startup garbage collection
        await sweep(client);

        // initializes modules
        const modules = moduleHandler.getModules(config.modules);
        const started = await moduleHandler.startModules(modules, client);
        log(`${started}/${modules.size} Modules Initialized. Startup complete`, client, false);
    });
}

async function shutdown() {
    //const endprocess = require('../commands/endprocess.js');
    endprocess.events.emit('end');
}

exports.init = bot_init;
exports.shutdown = shutdown;