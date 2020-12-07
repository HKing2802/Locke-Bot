const Discord = require('discord.js');
const logger = require('winston');
const mysql = require('mysql');
const unidecode = require('unidecode');
const auth = require('./auth.json');
const config = require('./config.json');

// Function Imports
const util = require('./util.js');
const processor = require('./commands/processor.js')

// Configure Winston logger
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

//db connection
const con = mysql.createConnection({
    host: auth.db_host,
    user: auth.db_user,
    password: auth.db_pass,
    database: 'lockebot_db'
})
con.connect(function (err) {
    if (err) throw err;
})

//bot login

const bot = new Discord.Client();
bot.login(auth.token)

bot.on('ready', () => {
    logger.info(`Logged in as ${bot.user.tag}!`)
})

 
//message catching
bot.on('message', (message) => {
    if (util.filterAttachment(message))
        return;

    if (message.content.substring(0, 1) == config.prefix) {
        if (config.active == 'true' && message.guild != null) {  //checks if bot response is active and is in a guild and not a DM
            processor.process(message);
        } else if (message.author.id == config.authorID) {  // checks if message author is author and then processes even if active is false
            processor.process(message);
        } else
            return;
    } else if (message.author.id == config.kaeID && config.kaeReact == 'true') {  //checks if message author is Kae and reaction is active
        message.react(message.guild.emojis.cache.get(config.modsgayEmojiID));  //reacts with emoji
    }
})

bot.on('messageDelete', (delmsg) => {
    if (delmsg.author.bot) {
        return;
    } else {
        con.query(`INSERT INTO messages(user_id, message) VALUES (${delmsg.author.id}, ${delmsg.content})`, function (err, result) {
            if (err) {
                logger.warn(`Error in inserting deleted message to database: ${err}`);
            } else {
                logger.info("Logged Deleted Message")
            }
        })
    }
})

bot.on('guildMemberUpdate', (oldUser, newUser) => {
    if (oldUser.nickname == newUser.nickname || newUser.nickname == null)
        return;
    else {
        for (let i = 0; i < config.nicknamePass.length; i++) {
            if (oldUser.id == config.nicknamePass[i]) {
                return;
            }
        }
        
        newNick = unidecode(newUser.nickname);
        if (newNick != newUser.nickname) {
            newUser.setNickname(newNick);
            logger.info(`Force changed a user's nickname to ${newNick}`);
        }
    }
})

bot.on('guildMemberAdd', (member) => {
    newNick = unidecode(member.user.username);
    if (newNick != member.user.username) {
        member.setNickname(newNick);
        logger.info(`Force changed a new user's nickname to ${newNick}`);
    }
})