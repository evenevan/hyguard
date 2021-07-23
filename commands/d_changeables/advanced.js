const fs = require('fs'); //test
const { prefix } = require('../../userConfig.json');
const funcImports = require( __dirname + '../../../functions');
const Discord = require('discord.js');
const databaseImports = require('../../databaseFuncs');
module.exports = {
	name: 'advanced',
  title: `Allows for advanced options`,
	description: `Allows you to add or change some special advanced option(s)`,
  usage: `\`${prefix}advanced <type>\`, \`${prefix}advanced current\``,
  args: true,
  database: true,
  cooldown: 5,
  permissions: ["VIEW_CHANNEL","SEND_MESSAGES","EMBED_LINKS","READ_MESSAGE_HISTORY"],
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

    const validAdvancedSettings = ["LOGINTIME"]

    if (args[0].toLowerCase() == 'current') {
        return currentData();
    } else if (!validAdvancedSettings.includes(args[0].toUpperCase())) {
        return message.channel.send(`${message.author}, that isn't a valid advanced option! Valid Advanced Options(s): ${validAdvancedSettings.join(", ")}`);
    } else {
        return getData();
    }

    async function getData() {
        let returnedData = await databaseImports.getData(message.author.id);

        if (returnedData.advanced) {
            var advancedSettings = returnedData.advanced.split(" ");
        } else {
            var advancedSettings = [];
        }

        switch (args[0].toUpperCase()) {
            case 'LOGINTIME':
              logintime();
              break;
            //case '':
              //function here
        }

        function logintime() {
          if (advancedSettings.includes("LOGINTIME")) {
            let findAndRemove = advancedSettings.indexOf(args[0].toUpperCase());
            advancedSettings.splice(findAndRemove, 1);
          } else {
            advancedSettings.push("LOGINTIME");
          }
          return writeData(advancedSettings, `${message.author}, the advanced setting \`Login Time\` is now ${!advancedSettings.includes("LOGINTIME") ? `set to only active once upon an irregular login!` : `set to repeateadly ping you upon an irregular login!`}`);
        };
      }

      async function writeData(advancedSettings, returnedMSG) {
        try {
          await databaseImports.changeData(message.author.id, advancedSettings.join(" "), `UPDATE data SET advanced = ? WHERE discordID = ?`);
          return message.channel.send(returnedMSG);
        } catch (err) {
          console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | An error occured while writing data. ${err}`);
          message.channel.send(`${message.author}, an error occured while writing data. Please report this. \`${err}\``);
        }
      };

      async function currentData() {
        try {
          let returnedData = await databaseImports.getData(message.author.id);
          
          if (returnedData.advanced) {
            var advancedSettings = returnedData.advanced.split(" ");
          } else {
            var advancedSettings = [];
          }

          let advancedEmbed = new Discord.MessageEmbed()
            .setColor('#7289DA')
            .setTitle(`${message.author.tag}'s Advanced Settings`)
            .setFooter(`Executed at ${dateString} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');

          for (let i = 0; i < validAdvancedSettings.length; i++) {
            if (validAdvancedSettings[i].includes(advancedSettings[i])) {
              advancedEmbed.addField(`${validAdvancedSettings[i]}`, `:green_square:`);
            } else {
              advancedEmbed.addField(`${validAdvancedSettings[i]}`, `:red_square:`);
            }
          }
        
          return message.reply(advancedEmbed);
  
        } catch (err) {
          console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | An error occured while writing data. ${err}`);
          message.channel.send(`${message.author}, an error occured while writing data. Please report this. \`${err}\``);
        }
      };

	},
};