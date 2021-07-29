const { prefix } = require('../../userConfig.json');
const databaseImports = require('../../databaseFuncs');
module.exports = {
	name: 'monitor',
  title: `Toggles the logging and monitoring of your account`,
	description: 'Allows you to turn the logging and monitoring of your player on or off',
    usage: `\`${prefix}monitor\``,
  cooldown: 7.5,
  database: true,
  permissions: ["VIEW_CHANNEL","SEND_MESSAGES"],
  guildPermissions: [],
	execute(message, args, client) {
      
          getAlerts();
          
      
          async function getAlerts() {
          try {
            let logResponse = await databaseImports.getData(message.author.id);

            let newLogState = (1 - logResponse.log);
            return writeLogState(newLogState, `${message.author}, logging and monitoring is now ${newLogState == 0 ? `off` : `on`}!`);
            
            
          } catch (err) {
              console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | An error occured while fetching data. ${err}`);
              message.channel.send(`${message.author}, an error occured while fetching data. Please report this. \`${err}\``);
          }
        };
      
          async function writeLogState(logResponse, alertMSG) {
            try {
              await databaseImports.changeData(message.author.id, logResponse, `UPDATE data SET log = ? WHERE discordID = ?`);
              return message.channel.send(alertMSG)
            } catch (err) {
              console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | An error occured while writing data. ${err}`);
              message.channel.send(`${message.author}, an error occured while writing data. Please report this. \`${err}\``);
            }
          };
      
    },
};
