function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
        var info = JSON.parse(body);
        for (chan in info.streams) {
            opts.channels.push(info.streams[chan].channel.name)
        }
        TWclient.connect()
        console.log(opts.channels);
    }
}
function getchannels() {
    let options = {
        url: 'https://api.twitch.tv/kraken/streams/?limit=100',
        headers: {
            'Accept': 'application/vnd.twitchtv.v5+json',
            'Client-ID': ''
        }
    };
    request(options, callback)
}
//getchannels()

