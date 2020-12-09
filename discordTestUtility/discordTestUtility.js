
function captureStream(stream) {
    var oldWrite = stream.write;
    var buf = '';
    stream.write = function (chunk, encoding, callback) {
        buf += chunk.toString();
        oldWrite.apply(stream, arguments);
    }

    return {
        unhook: function unhook() {
            stream.write = oldWrite;
        },
        captured: function () {
            return buf;
        }
    };
}

function createMessage(content);

function createUser(username,);

function createChannel(guild);

function createGuild(client);

exports.captureStream = captureStream;


/* all require message
 * 
 * channel = TextChannel
 * guild = Guild
 * member = GuildMember
 * author = User
 * client = Client
 * 
 * ping
 *  channel
 *  guild
 *  
 * endprocess
 *  client
 *  
 * shutdown
 *  none
 *  
 * startup
 *  none
 *  
 * mute
 *  member
 *  author
 *  channel
 *  guild
 *  
 * unmute
 *  member
 *  author
 *  channel
 *  guild
 *  
 * help
 *  channel
 *  
 * snipe
 *  author
 *  member
 *  channel
 *  
 * verify
 *  author
 *  member
 *  guild
 *  
 * kick
 *  author
 *  member
 *  guild
 *  channel
 *  
 * ban
 *  author
 *  member
 *  guild
 *  channel
 *  
 * reactKae
 *  author
 *  
*/