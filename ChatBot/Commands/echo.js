module.exports = {
    name: 'echo',
    description: 'Echo message',
    execute(channel, userstate, params, connection) {
        // If there's something to echo:
        if (params.length) {
            // Join the params into a string:
            const msg = params.join(' ')
            // Send it back to the correct place:
            connection.Twitch.say(channel, msg)
        } else { // Nothing to echo
            console.log(`* Nothing to echo`)
        }
    }
};