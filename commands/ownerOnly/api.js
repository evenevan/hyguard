const funcImports = require( __dirname + '../../../functions');
const { prefix } = require('../../userConfig.json');
const sqlite = require('sqlite3').verbose();
const fetch = require('node-fetch');
const Discord = require('discord.js');
const block = require('./block');
module.exports = {
	name: 'api',
  title: 'Toggles API usage',
	description: 'Toggles API usage',
    usage: `\`${prefix}api\``,
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

    if (api == false) {

        var api = true;
        funcImports.saveOwnerSettings(api, userLimit, blockedUsers, dst);
        console.log(`API commands and functions are now on!`);
        return message.channel.send(`${message.author}, API commands and functions are now on!`);

    } else if (api == true) {

        var api = false;
        funcImports.saveOwnerSettings(api, userLimit, blockedUsers, dst);
        console.log(`API commands and functions are now off!`);
        return message.channel.send(`${message.author}, API commands are now off!`);

    }
        } catch (err) {
            console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | An error occured while using data with fs. ${err}`);
			message.channel.send(`${message.author}, an error occured while using data with fs. Please report this. \`${err}\``);
        }
    },
};
