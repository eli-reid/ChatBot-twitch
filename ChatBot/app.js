const fs = require('fs');
const Commands = new Map(); 
const commandFiles = fs.readdirSync('./Commands').filter(file => file.endsWith('.js'));
const DebugHelper = true;
const Connection = require('./connections');


//intialize message storage
var ChatLines = [];
var Timeouts = [];
var Bans = [];
 

//post to log to database
setInterval(LogChatToDBpool, Connection.MySQL.UpdateInterval);
function LogChatToDBpool() {
    let date = new Date()
    if (ChatLines.length > 0 || Timeouts.length > 0 || Bans.length > 0) {
        Connection.MySQL.Pool.getConnection(function (err, conn) {
            if (err) Debug(err);
            //Messages
            if (ChatLines.length > 0) {
                conn.query("INSERT INTO ChatLog(`ChatRoom`,`MsgType`, `User`, `ChatMsg`, `TimeStamp`) VALUES ?", [ChatLines], function (err, result) {
                    if (err)
                        Debug(err);
                    else {
                        ChatLines.length = 0;
                        Debug("Messages: " + result.affectedRows + ": " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds());
                    }
                });
            }
            //Timeouts
            if (Timeouts.length > 0) {                
                let Msgs = [];
                Timeouts.forEach(function (timeout) {                  
                    conn.query("SELECT ChatMsg FROM ChatLog  WHERE User  LIKE '" + timeout.username + "' ORDER BY id DESC LIMIT 10", function (err, rows) {
                        if (err) Debug(err);
                        rows.forEach((row) => { Msgs.push(row.ChatMsg) });
                        let  values = [];
                        values.push([timeout.channel, timeout.username, timeout.reason, timeout.duration, Connection.MySQL.Pool.escape(Msgs.toString()), timeout.date]);
                        conn.query("INSERT INTO ChatTimeout(`ChatRoom`,`User`,`Reason`,`Duration`,`Msgs`,`TimeStamp`) VALUES ?", [values], function (err, result) {
                            if (err) Debug(err, values);
                            else {
                                Debug("Timeouts: " + result.affectedRows + ": " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds());
                            }
                        }); 
                    });
                });
                Timeouts.length = 0;
            }
            //Bans
            if (Bans.length > 0) {               
                let Msgs = [];
                Bans.forEach(function (ban) {
                    conn.query("SELECT ChatMsg FROM ChatLog  WHERE User  LIKE '" + ban.username + "' ORDER BY id DESC LIMIT 10", function (err, rows) {
                        if (err) Debug(err);
                        rows.forEach((row) => { Msgs.push(row.ChatMsg) });
                        let values = [];
                        values.push([ban.channel, ban.username, ban.reason,  Connection.MySQL.Pool.escape(Msgs.toString()), ban.date]);
                        conn.query("INSERT INTO ChatBan(`ChatRoom`,`User`,`Reason`,`Msgs`,`TimeStamp`) VALUES ?", [values], function (err, result) {
                            if (err) Debug(err, values);
                            else {
                                Debug("Ban: " + result.affectedRows + ": " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds());
                            }
                        });
                    });
                });
                Bans.length = 0;
            }
            conn.release();               
        });       
    }
}

//load commands into Map
for (const file of commandFiles) {
    const command = require(`./Commands/${file}`);
    Commands.set(command.name, command);
}

//twitch intialize 
Connection.Twitch.connect();

Connection.Twitch.on('connected', function (addr, port) {
    Debug(`* Connected to ${addr}:${port}`)
    //console.log(spell.suggest('colour'))
});

Connection.Twitch.on('message', function (channel, userstate, msg, self) {
    if (self) { return; }
    words=msg.split(' ')
    words.forEach((word) => { console.log(word + " : " + spell.suggest(word)) })
  
    rousseau(msg, function (err, results) {
        console.log(results)
    });
    // get now()
    let date = new Date();

    //addmsg to queue
    ChatLines.push([channel, userstate['message-type'], userstate.username, Connection.MySQL.Pool.escape(msg), date]);

    // This isn't a command since it has no prefix:
    if (Connection.CommandPrefix.indexOf(msg.substr(0, 1)) == -1) {
        Debug("just a message: " + userstate['id'])
        return
    }

    // Split the message into individual words:
    const parse = msg.slice(1).split(' ')
    // The command name is the first (0th) one:
    const commandName = parse[0]
    // The rest (if any) are the parameters:
    const params = parse.splice(1)
    if (Commands.has(commandName)) {
        try {
            Commands.get(commandName).execute(channel, userstate, params, Connection);
        }
        catch (error) {
            Debug(error);
        }
    }
});

Connection.Twitch.on('disconnected', function (reason) {
    Debug(`Disconnected: ${reason}`)
});

Connection.Twitch.on('whisper', function (from, userstate, message, self) {
    if (self) { return }
    Connection.Twitch.whisper(from, "sweet nothings")
});

Connection.Twitch.on('ban', function (channel, username, reason) {
    Bans.push({
        channel: channel,
        username: username,
        reason: reason,
        date: new Date()
    });
});

Connection.Twitch.on('cheer', function (channel, userstate, message) {
    Connection.Twitch.say(channel, "foxzLUV  foxzCLAW foxzCLAW !!!!! " + userstate.username +" With the BITTYSHAKERS !!!! foxzCLAW foxzCLAW foxzLUV")
});

Connection.Twitch.on('notice', function (channel, msgid, message) {

});

Connection.Twitch.on('resub', function (channel, username, months, message, userstate, methods) {
    if (channel === "#alilfoxz")
        Connection.Twitch.say(channel, "!hype1")
});

Connection.Twitch.on('subscription', function (channel, username, method, message, userstate) {
    Connection.Twitch.say(channel, "!hype1")
});

Connection.Twitch.on('timeout', function (channel, username, reason, duration) {
    Timeouts.push({
        channel: channel,
        username: username,
        reason: reason,
        duration: duration,
        date: new Date()
    });
    Debug(reason)
});

Connection.Twitch.on('clearmsg', function (channel, msg, username,msgid) {
        duration = 0;
        reason = "CLRMSG";
        Timeouts.push({
            channel: channel,
            username: username,
            reason: reason,
            duration: duration,
            date: new Date()
    });
    Debug(msgid)
});

//gloabal functions
function Debug(msg) {
    if (DebugHelper)
        console.log(msg);
}
