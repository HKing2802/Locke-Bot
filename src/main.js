const { Client, Intents } = require('discord.js');
const auth = require('../auth.json');
const { sweep } = require('../modules/timed/dbGarbageCollection.js');
const db = require('./db.js');
const { log } = require('./util.js');
const moduleHandler = require('./module_handler.js');

const config = require('./config.js');


function bot_init() {
    // Generate Intents
    const clientIntents = new Intents();
    clientIntents.add(Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_BANS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGES, Intents.FLAGS.GUILDS);

    // bot login
    const client = new Client({ intents: clientIntents });
    client.login(auth.token);

    client.once('ready', async () => {
        // initialize configs
        config.initialize(client);

        log(`------------------------------------------------------------------`, client, false);
        log(`Logged in as ${client.user.tag}`, client, false);

        // Connect to Database
        db.connect()
            .then(async () => {
                // startup garbage collection
                await sweep(client);

                // initializes modules
                const modules = moduleHandler.getModules(config.getConfig('modules'));
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