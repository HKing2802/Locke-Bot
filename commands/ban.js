const util = require('../util.js');

const name = "ban";

function ban(message, args) {
    const chan = message.channel;
    if (util.getPerm(message.member)) {
        if (message.mention_everyone) {
            chan.send("I can't Ban everyone");
            return false
        } else if (message.mentions.members.first() == undefined) {
            chan.send("No member specified");
            return false
        } else {
            const target = message.mentions.members.first();
            if (getPerm(target, true)) {
                chan.send("Can't ban a staff member");
                return false
            }

            let reason = "";
            if (args.length > 1) {
                for (let i = 1; i < args.length; i++) {
                    reason += args[i] + " ";
                }
            }
            if (reason == "") reason = "No reason given";

            target.ban({ reason: `${reason} - Banned by ${message.author.tag}` })
                .then((m) => {
                    chan.send(`Banned ${m.user.tag|m.tag|m} for ${reason}`);
                    //log
                    return true
                })
                .catch(err => {
                    chan.send(`Unable to ban the member`);
                    //log
                    return false
                })
        }
    }
    return false
}

exports.main = ban;
exports.name = name;