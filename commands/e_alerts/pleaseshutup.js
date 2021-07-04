const fs = require('fs');
const { prefix } = require('../../userConfig.json');
const funcImports = require( __dirname + '../../../functions');
const databaseImports = require('../../databaseFuncs');
module.exports = {
	name: 'pleaseshutup',
  aliases: ['psu', 'pleaseshut'],
  title: 'Toggles all alerts',
	description: 'Toggles all alerts!!',
  usage: `\`${prefix}orange\``,
  database: true,
  cooldown: 5,
	execute(message, args, client) {
    getAlerts();
    
    async function getAlerts() {
      try {
          let response = await databaseImports.getData(message.author.id);
          let alertsResponse = response.alerts.split(" ")

            if (alertsResponse[2] == 0 || alertsResponse[3] == 0 || alertsResponse[4] == 0 || alertsResponse[5] == 0) {
              let newAlertsToggle =  alertsResponse.map(function(item) { return item == '0' ? '1' : item; });
              if (!response.blacklist) newAlertsToggle[0] = 0
              if (!response.whitelist) newAlertsToggle[1] = 0
              return writeAlerts(newAlertsToggle, `${message.author}, ${!response.blacklist || !response.whitelist ? `most alerts are now on! Your whitelist and/or blacklist is off as you did not set it up.` : `all alerts are now on!`}`)
    
            } else {
              let newAlertsToggle =  alertsResponse.map(function(item) { return item == '1' ? '0' : item; });
              return writeAlerts(newAlertsToggle, `${message.author}, all alerts are now off!`);
            }
          
      } catch (err) {
          console.log(`ERROR_3: ${err}`);
          message.channel.send(`An error occured while fetching data. Please report this. ERROR_3: \`${err}\``);
      }
    };

    async function writeAlerts(alertsResponse, alertMSG) {
      try {
        let response = await databaseImports.changeData(message.author.id, alertsResponse.join(" "), `UPDATE data SET alerts = ? WHERE discordID = ?`);
        return message.channel.send(alertMSG);
      } catch (err) {
        console.log(`ERROR_3: ${err}`);
        message.channel.send(`An error occured while writing data. Please report this. ERROR_3: \`${err}\``);
      }
    };

	},
};