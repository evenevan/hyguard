const fs = require('fs');
const { prefix } = require('../../userConfig.json');
const Discord = require('discord.js');
const databaseImports = require('../../databaseFuncs');
const funcImports = require( __dirname + '../../../functions');
module.exports = {
	name: 'offline',
  title: `Set when logins should not occur`,
	description: 'Allows you to set when logins SHOULD NOT occur, allowing you to recieve an alert on unusual sessions. Set the time using the 24 hour standard',
  usage: `\`${prefix}offline <0:00> <0:00>\`, \`${prefix}offline current\`\n\nExample argument:\n\`${prefix}offline 1:00 8:00\` - Blacklists logins from 1:00 am to 8:00 am\n\`${prefix}offline 23:30 8:15\` - Blacklists logins from 11:30 pm to 8:15 am`,
  args: true,
  database: true,
  cooldown: 5,
  permissions: ["VIEW_CHANNEL","SEND_MESSAGES"],
	execute(message, args, client, row) {

    const input = message.content.slice(9).toString()

    if (args[0].toLowerCase() == 'current') {
      return currentOffline();
    } else if (!/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9] ([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/g.test(message.content.slice(9))) {
      return message.channel.send(`${message.author}, that doesn't seem to be valid! Refer to the proper command usage with \`${prefix}help offline\``);
    } else {
      function timeToDecimals(time) {
        let minutesToDecimal = (time.slice(-2) / 60);
        let hourToDecimal = time.slice(0, -3) * 1;
        let result = (hourToDecimal + minutesToDecimal);
        return result;
      };
      let processedInput = input.replace(/[^\d :]+/gm, "").replace(/\s{2,}/g, ' ').split(" "); //removes everything expect for the numbers, spaces, and :
      let offlineDecimalInput = timeToDecimals(processedInput[0]) + " " + timeToDecimals(processedInput[1]);
      checkOffline(offlineDecimalInput);
    }

    async function checkOffline(offlineDecimalInput) {
      try {
        let response = await databaseImports.getData(message.author.id);
        
        if (offlineDecimalInput === response.offline) return message.channel.send(`${message.author}, your offline time on Hypixel was already set from ${twentyFourToTwelve(args[0])} to ${twentyFourToTwelve(args[1])}!`);

        writeNewOffline(offlineDecimalInput)
    
      } catch (err) {
        console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | An error occured while fetching data. ${err}`);
        message.channel.send(`${message.author}, an error occured while fetching data. Please report this. \`${err}\``);
      }
    };
    
    async function writeNewOffline(offlineDecimalInput) {
      try {
        await databaseImports.changeData(message.author.id, offlineDecimalInput, `UPDATE data SET offline = ? WHERE discordID = ?`);
        return message.channel.send(`${message.author}, your offline time on Hypixel is now set to ${twentyFourToTwelve(args[0])} to ${twentyFourToTwelve(args[1])}.`)
      } catch (err) {
        console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | An error occured while writing data. ${err}`);
        message.channel.send(`${message.author}, an error occured while writing data. Please report this. \`${err}\``);
      }
    
    };
    
    async function currentOffline() {
      try {
        let response = await databaseImports.getData(message.author.id)
        let offlineArray = response.offline.split(" ")

        return message.channel.send(`${message.author}, your offline time on Hypixel is set to ${twentyFourToTwelve(decimalToTime(offlineArray[0]))} to ${twentyFourToTwelve(decimalToTime(offlineArray[1]))}.`);
      } catch (err) {
        console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | An error occured while fetching data. ${err}`);
        message.channel.send(`${message.author}, an error occured while fetching data. Please report this. \`${err}\``);
      }
    };

    function twentyFourToTwelve(time) {
      time = time.toString().match(/^([01]?\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];
      if (time.length > 1) {
        time = time.slice(1);
        time[5] = +time[0] < 12 ? ' am' : ' pm';
        time[0] = +time[0] % 12 || 12;
      }
      return time.join('');
    };

    function decimalToTime(decimal) {
      let hour = Math.floor(decimal)
      let min = Math.round((decimal - hour) * 60)
      return hour + ":" + (min / 100).toFixed(2).slice(2)
      };

	},
};
