const tmi = require('tmi.js')
const mysql = require('mysql')
const Discord = require('discord.js')
const Settings = require('./JSON/Settings.json')
var Connection = {
    CommandPrefix: Settings.CommandPrefix,
    Twitch: new tmi.client(Settings.Twitch),
    TwitchAPI: Settings.TwitchAPI,
    MySQL: {
        Pool:mysql.createPool(Settings.MySQL),
        UpdateInterval: Settings.MySQL.DatabaseInterval
    }
   
}
module.exports = Connection