const Discord = require('discord.js');
const logger = require('winston');
const mysql = require('mysql');
const auth = require('./auth.json');
const package = require('./package.json');
const file_blacklist = require('./file_blacklist.json');
const config = require('./config.json');

// Function Imports
//import {getPerm, help} from './util.js'

// Configure Winston logger
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

//db connection
const dbCon = mysql.createConnection({
    host: auth.db_host,
    user: auth.db_user,
    password: auth.db_pass,
    database: 'lockebot_db'
})

//bot login
//const bot = new Discord.Client();
//bot.login(auth.token)

//bot.on('ready', () => {
//    logger.info(`Logged in as ${bot.user.tag}!`)
//})

dbCon.connect(function (err) {
    if (err) throw err;
    con.query("SELECT * FROM messages", function (err, result, fields) {
        if (err) throw err;
        console.log(result)
    })
})


//message catching


//call to processor