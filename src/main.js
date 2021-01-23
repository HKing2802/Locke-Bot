const { Client } = require('discord.js');
const auth = require('../auth.json');
require('hjson/lib/require-config');
const config = require('../config.hjson');
const db = require('./db.js');
const { log } = require('./util.js');
const moduleHandler = require('./module_handler.js');
const { sweep } = require('../modules/timed/dbGarbageCollection.js');

// bot login
const client = new Client();
client.login(auth.token);

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
    moduleHandler.startModules(modules, client);
    log(`Modules Initialized. Startup complete`, client, false);
});
