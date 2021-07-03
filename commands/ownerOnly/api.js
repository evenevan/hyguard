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
	execute(message, args, client) {
        try {
    let readData = funcImports.readOwnerSettings();
    var api = readData.api,
    userLimit = readData.userLimit,
    blockedUsers = readData.blockedUsers;

    if (api == false) {

        var api = true;
        funcImports.saveOwnerSettings(api, userLimit, blockedUsers);
        console.log(`API commands and functions are now on!`);
        return message.channel.send(`API commands and functions are now on!`);

    } else if (api == true) {

        var api = false;
        funcImports.saveOwnerSettings(api, userLimit, blockedUsers);
        console.log(`API commands and functions are now off!`);
        return message.channel.send(`API commands are now off!`);

    }
        } catch (err) {
            console.log(`ERROR_14: ${err}`);
			message.channel.send(`An error occured while writing data. Please report this. ERROR_4: \`${err}\``);
        }
    },
};
