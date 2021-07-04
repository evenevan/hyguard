const { prefix } = require('../../userConfig.json');
const databaseImports = require('../../databaseFuncs');
module.exports = {
	name: 'monitor',
  title: 'Toggles the logging and monitoring of your account',
	description: 'Allows you to turn the logging and monitoring of your player on or off',
    usage: `\`${prefix}monito\``,
  cooldown: 7.5,
  database: true,
	execute(message, args, client) {
      
          getAlerts();
          
      
          async function getAlerts() {
          try {
            let logResponse = await databaseImports.getData(message.author.id);

            let newLogState = (1 - logResponse.log);
            return writeLogState(newLogState, `${message.author}, logging and monitoring is now ${newLogState == 0 ? `off` : `on`}!`);
            
            
          } catch (err) {
              console.log(`ERROR_3: ${err}`);
              message.channel.send(`An error occured while fetching data. Please report this. ERROR_3: \`${err}\``);
          }
        };
      
          async function writeLogState(logResponse, alertMSG) {
            try {
              await databaseImports.changeData(message.author.id, logResponse, `UPDATE data SET log = ? WHERE discordID = ?`);
              return message.channel.send(alertMSG)
            } catch (err) {
              console.log(`ERROR_3: ${err}`);
              message.channel.send(`An error occured while writing data. Please report this. ERROR_3: \`${err}\``);
            }
          };
      
    },
};
