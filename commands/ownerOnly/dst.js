const funcImports = require( __dirname + '../../../functions');
const { prefix } = require('../../userConfig.json');
const sqlite = require('sqlite3').verbose();
const fetch = require('node-fetch');
const Discord = require('discord.js');
const block = require('./block');
module.exports = {
	name: 'dst',
  title: 'Toggles DST',
	description: 'Toggles DST, this is a temporary path.',
    usage: `\`${prefix}dst\``,
  cooldown: 5,
  ownerReq: true,
  database: false,
  permissions: ["VIEW_CHANNEL","SEND_MESSAGES"],
	execute(message, args, client) {
        try {
    let readData = funcImports.readOwnerSettings();
    var api = readData.api,
    userLimit = readData.userLimit,
    blockedUsers = readData.blockedUsers,
    dst = readData.dst;

    if (dst == false) {

        var dst = true;
        funcImports.saveOwnerSettings(api, userLimit, blockedUsers, dst);
        console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | Daylight savings is now on!`);
        return message.channel.send(`${message.author}, daylight savings is now on!`);

    } else if (dst == true) {

        var dst = false;
        funcImports.saveOwnerSettings(api, userLimit, blockedUsers, dst);
        console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | Daylight savings is now off now off!`);
        return message.channel.send(`${message.author}, daylight savings is now off!`);

    }
        } catch (err) {
            console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | An error occured while using data with fs. ${err}`);
			message.channel.send(`${message.author}, an error occured while using data with fs. Please report this. \`${err}\``);
        }
    },
};
