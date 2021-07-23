const funcImports = require( __dirname + '../../../functions');
const { prefix } = require('../../userConfig.json');
const sqlite = require('sqlite3').verbose();
const fetch = require('node-fetch');
const Discord = require('discord.js');
module.exports = {
	name: 'userlimit',
  title: 'Change the maximum amount of users',
	description: 'Change the maximum amount of suers',
    usage: `\`${prefix}userlimit <number>\``,
  cooldown: 5,
  ownerReq: true,
  database: false,
  permissions: ["VIEW_CHANNEL","SEND_MESSAGES","READ_MESSAGE_HISTORY"],
	execute(message, args, client) {
        try {
    let readData = funcImports.readOwnerSettings();
    var api = readData.api,
    userLimit = readData.userLimit,
    blockedUsers = readData.blockedUsers
    dst = readData.dst;

    if (!args[0] || isNaN(args[0]) && args[0] !== 'current') return message.channel.send(`${message.author}, you didn't provide any arguments.`);

    if (args[0] == 'current') return message.channel.send(`${userLimit}`);

    var userLimit = args[0]
    funcImports.saveOwnerSettings(api, userLimit, blockedUsers, dst);
    return message.channel.send(`${message.author}, max amount of users is now set to ${args[0]}`);

    
        } catch (err) {
            console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | An error occured while using data with fs. ${err}`);
			      message.channel.send(`${message.author}, an error occured while using data with fs. Please report this. \`${err}\``);
        }
    },
};
