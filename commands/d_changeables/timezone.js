const fs = require('fs');
const { prefix } = require('../../userConfig.json');
const databaseImports = require('../../databaseFuncs');
const { time } = require('console');
const funcImports = require( __dirname + '../../../functions');
const Discord = require('discord.js');
module.exports = {
	name: 'timezone',
  title: 'Set a new timezone for the bot\'s time services',
	description: `Allows you to set a new timezone/UTC offset! Quick Reference:\n\n**+0** Greenwich Mean Time (GMT)\n**+1** Central European Time (CET)\n**+2** Eastern European Time (EET)\n**+3** Moscow Time (MSK)\n**+4** Armenia Time (AMT)\n**+5** Pakistan Standard Time (PKT)\n**+6** Omsk Time (OMSK)\n**+7** Kranoyask Time (KRAT)\n**+8** China Standard Time (CST)\n**+9** Japan Standard Time (JST)\n**+10** Eastern Australia Standard Time (AEST)\n**+11** Sakhalin Time (SAKT)\n**+12** New Zealand Standard Time (NZST)\n\n**-0** Greenwich Mean Time (GMT)\n**-1**	West Africa Time (WAT)\n**-2** Azores Time (AT)\n**-3**	Argentina Time (ART)\n**-4** Atlantic Standard Time (AST)\n**-5** Eastern Standard Time (EST)\n**-6** Central Standard Time (CST)\n**-7** Mountain Standard Time (MST)\n**-8** Pacific Standard Time (PST)\n**-9** Alaska Standard Time (AKST)\n**-10** Hawaii Standard Time (HST)\n**-11** Nome Time (NT)\n**-12** International Date Line West (IDLW)`,
  usage: `\`${prefix}timezone <UTC Offset>\`, \`${prefix}timezone current\``,
  aliases: ['tz'],
  args: true,
  database: true,
  cooldown: 5,
	execute(message, args, client, row) {
    if (row !== undefined) {
      var tzOffset = (row.timezone * 3600000);
      var timeString = new Date(Date.now() + tzOffset).toLocaleTimeString('en-IN', { hour12: true }); 
      var dateString = funcImports.epochToCleanDate(new Date(Date.now() + tzOffset));
    } else {
      var tzOffset = 0
      var timeString = `${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC`
      var dateString = funcImports.epochToCleanDate(new Date());
    }
    
    
    if (args[0].toLowerCase() == 'current') {
      return currentVersion();
    } else if (!/^([+-](?:2[0-3]|1[0-9]|[0-9]|0[0-9])(:?[0-5]\d)?)$/g.test(args[0])) {
      let formatExample = new Discord.MessageEmbed()
      .setColor('#FF5555')
      .setTitle('Invalid Format Or Offset!')
      .setFooter(`Executed at ${dateString}} | ${timeString} UTC`, 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/e/e9/Book_and_Quill_JE2_BE2.png/revision/latest/scale-to-width-down/160?cb=20190530235621')
      .setDescription(`That isn't valid! It must be between -23:59 and +23:59. Please use the format \`-/+0\` or \`-/+0:00\`. See \`${prefix}help timezone\` for common timezones nad thie UTC offsets\n\n**Examples:**`)
      .addField('-07:00', '7 hours behind UTC')
      .addField(`-7`, `7 hours behind UTC`)
      .addField('+05:45', '5 hours and 45 minutes ahead of UTC')
      .addField('+5:45', '5 hours and 45 minutes ahead of UTC')
      return message.channel.send(formatExample).then(async msg => {
        setTimeout(() => {
          msg.delete();
        }, 60000);
      });
    } else {
      checkTimezone();
    }
    
    async function checkTimezone() {
      try {
        let response = await databaseImports.getData(message.author.id)

        function UTCOffsetToDecimals(utc) {
          if (!utc.includes(":")) {
            return `${utc * 1}`
          } else if (utc.slice(0, 1) !== "+" && utc.slice(0, 1) !== "-") {
            let minutesToDecimal = (utc.slice(-2) / 60);
            let hours = utc.slice(0, -3) * 1;
            let result = (hours + minutesToDecimal);
            return result;
          }
          let minutesToDecimal = (utc.slice(-2) / 60);
          let hours = utc.slice(1, -3) * 1;
          let result = `${utc.slice(0, 1) == '+' ? `${hours + minutesToDecimal}` : `${utc.slice(0, 1) + (hours + minutesToDecimal)}`}`
          return result;
          };
    
        if (UTCOffsetToDecimals(args[0]) == response.timezone) return message.channel.send(`${message.author}, your timezone/UTC Offset was already set to ${args[0]}!`).then(async msg => {
          setTimeout(() => {
            msg.delete();
          }, 10000);
        });
    
        writeNewVersion(UTCOffsetToDecimals(args[0]));
    
      } catch (err) {
        console.log(`ERROR_3: ${err}`);
        message.channel.send(`An error occured while fetching data. Please report this. ERROR_3: \`${err}\``);
      }
    };
    
    async function writeNewVersion(timezone) {
      try {
        await databaseImports.changeData(message.author.id, timezone, `UPDATE data SET timezone = ? WHERE discordID = ?`);
        return message.channel.send(`${message.author}, your timezone/UTC offset is now set to ${args[0]}.`);
      } catch (err) {
        console.log(`ERROR_3: ${err}`);
        message.channel.send(`An error occured while writing data. Please report this. ERROR_3: \`${err}\``);
      }
    
    };
    
    async function currentVersion() {
      try {
        let response = await databaseImports.getData(message.author.id)

        function decimalsToUTC(decimal) {
          if (/\./.test(decimal)) {
                let decimalArray = decimal.toString().split(".");
                let hour = decimalArray[0] * 1;
                let minutes = Math.round((`0.${(decimalArray[1])}`) * 60);
                if (hour < 0) return hour + ":" + (minutes * 1).toFixed(2).slice(0, -3);
                return "+" + hour + ":" + (minutes * 1).toFixed(2).slice(0, -3);
              } else {
                if (decimal < 0) return decimal;
              return "+" + decimal;
          }    
        };
        return message.channel.send(`${message.author}, your timezone/UTC offset is set to ${decimalsToUTC(response.timezone)}.`);
      } catch (err) {
        console.log(`ERROR_3: ${err}`);
        message.channel.send(`An error occured while fetching data. Please report this. ERROR_3: \`${err}\``);
      }
    };
    
        
	},
};