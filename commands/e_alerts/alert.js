const fs = require('fs'); //test
const { prefix } = require('../../userConfig.json');
const funcImports = require( __dirname + '../../../functions');
const Discord = require('discord.js');
const databaseImports = require('../../databaseFuncs');
const alertTypes = ["blacklist", "whitelist", "language", "session", "offline", "version"];
module.exports = {
	name: 'alert',
  aliases: ['a','alerts'],
  title: 'Toggle alert types',
	description: `Allows you to toggle individual alert types`,
  usage: `\`${prefix}alert <alert type>\`, \`${prefix}alert current\`\n\nValid Alert Types: ${alertTypes.join(", ")}\n\nBlacklist: Alerts on a blacklisted gametype\nWhitelist: Alerts on a non-whitelisted gametype\nLanguage: Alerts on an unusual language\nSession: Alerts on logins, logouts, relogs, and short sessions\nOffline: Alerts on a login in time mandated as offline time\nVersion: Alerts on an unusual version of Minecraft`,
  args: true,
  database: true,
  cooldown: 2.5,
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
      return currentAlerts();
    } else if (!alertTypes.includes(args[0].toLowerCase())) {
      return message.channel.send(`${message.author}, that isn't a valid alert type! Valid Alert Types: ${alertTypes.join(", ")}`).then(async msg => {
        setTimeout(() => {
          msg.delete();
        }, 30000);
      });
    } else {
      return getAlerts();
    }

    async function getAlerts() {
    try {
        let alertsString = await databaseImports.getData(message.author.id);
        let alertsResponse = alertsString.alerts.split(" ");
      if (args[0].toLowerCase() == 'blacklist') {
          alertsResponse[0] = (1 - alertsResponse[0]);
          return writeAlerts(alertsResponse, `${message.author}, your blacklisted game alerts are now ${alertsResponse[0] == 0 ? `off` : `on`}!`);

      } else if (args[0].toLowerCase() == 'whitelist') {
          alertsResponse[1] = (1 - alertsResponse[1]);
          return writeAlerts(alertsResponse, `${message.author}, your non-whitelisted game alerts are now ${alertsResponse[1] == 0 ? `off` : `on`}!`);

      }  else if (args[0].toLowerCase() == 'language') {
          alertsResponse[2] = (1 - alertsResponse[2]);
          return writeAlerts(alertsResponse, `${message.author}, your language alerts are now ${alertsResponse[2] == 0 ? `off` : `on`}!`);

      } else if (args[0].toLowerCase() == 'session') {
        alertsResponse[3] = (1 - alertsResponse[3]);
        return writeAlerts(alertsResponse, `${message.author}, your session alerts are now ${alertsResponse[3] == 0 ? `off` : `on`}!`);

      } else if (args[0].toLowerCase() == 'offline') {
        alertsResponse[4] = (1 - alertsResponse[4]);
        return writeAlerts(alertsResponse, `${message.author}, your offline login alerts are now ${alertsResponse[4] == 0 ? `off` : `on`}!`);

      } else if (args[0].toLowerCase() == 'version') {
        alertsResponse[5] = (1 - alertsResponse[5]);
        return writeAlerts(alertsResponse, `${message.author}, your version alerts are now ${alertsResponse[5] == 0 ? `off` : `on`}!`);

      }
        
    } catch (err) {
        console.log(`ERROR_3: ${err}`);
        message.channel.send(`An error occured while fetching data. Please report this. ERROR_3: \`${err}\``);
    }
  };

    async function writeAlerts(alertsResponse, alertMSG) {
      try {
        await databaseImports.changeData(message.author.id, alertsResponse.join(" "), `UPDATE data SET alerts = ? WHERE discordID = ?`);
        return message.channel.send(alertMSG);
      } catch (err) {
        console.log(`ERROR_3: ${err}`);
        message.channel.send(`An error occured while writing data. Please report this. ERROR_3: \`${err}\``);
      }
    };

    async function currentAlerts() {
      try {
        let alertsString = await databaseImports.getData(message.author.id);
        let alertsResponse = alertsString.alerts.split(" ");

        a = alertsResponse.map(function(item) { return item == '1' ? ':green_square:' : item; });
        alertsCurrent = a.map(function(item) { return item == '0' ? ':red_square:' : item; });

        let alertData = new Discord.MessageEmbed()
          .setColor('#7289DA')
          .setTitle(`${message.author.tag}'s Alerts`)
          .setFooter(`Executed at ${dateString} | ${timeString}`, 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/e/e9/Book_and_Quill_JE2_BE2.png/revision/latest/scale-to-width-down/160?cb=20190530235621');
          alertData.addFields(
            { name: 'Blacklisted Games Alert', value: `${alertsCurrent[0]}` },
            { name: 'Non-Whitelisted Games Alert', value: `${alertsCurrent[1]}` },
            { name: 'Language Alert', value: `${alertsCurrent[2]}` },
            { name: 'All Session Related Alerts', value: `${alertsCurrent[3]}` },
            { name: 'Offline Time Alerts', value: `${alertsCurrent[4]}` },
            { name: 'Version Alerts', value: `${alertsCurrent[5]}` },
          )
        return message.reply(alertData);

      } catch (err) {
        console.log(`ERROR_3: ${err}`);
        message.channel.send(`An error occured while writing data. Please report this. ERROR_3: \`${err}\``);
      }
    };
	},
};