const fs = require('fs');
const { prefix } = require('../../userConfig.json');
const databaseImports = require('../../databaseFuncs');
const funcImports = require( __dirname + '../../../functions');
module.exports = {
	name: 'language',
  aliases: ['lang'],
  title: `Set a whitelisted language`,
	description: 'Allows you to whitelist a language for use on Hypixel',
  usage: `\`${prefix}language <language>\`, \`${prefix}language current\``,
  args: true,
  database: true,
  cooldown: 5,
  permissions: ["VIEW_CHANNEL","SEND_MESSAGES","READ_MESSAGE_HISTORY"],
	execute(message, args, client) {

    const readData = funcImports.readConstants();
    const languages = readData.languages;
    
    if (args[0].toLowerCase() == 'current') {
      return currentVersion();
    } else if (!languages.includes(args[0].toUpperCase())) {
      return message.channel.send(`${message.author}, that doesn't seem to be a valid language! Please choose one of the following: English, German, French, Dutch, Spanish, Italian, Chinese_Simplified, Chinese_Traditional, Portuguese_BR, Russian, Korean, Polish, Japanese, Pirate, Portuguese_PT, or Greek.`).then(async msg => {
        setTimeout(() => {
          msg.delete();
        }, 20000);
      });
    } else {
      checkLanguage();
    }
    
    async function checkLanguage() {
      try {
        let response = await databaseImports.getData(message.author.id);
    
        if (args[0].toUpperCase() == response.language) return message.channel.send(`${message.author}, your whitelisted language on Hypixel was already set to ${args[0].toUpperCase()}!`).then(async msg => {
          setTimeout(() => {
            msg.delete();
          }, 10000);
        });
    
        writeNewLanguage();
    
      } catch (err) {
        console.log(`ERROR_3: ${err}`);
        message.channel.send(`An error occured while fetching data. Please report this. ERROR_3: \`${err}\``);
      }
    };
    
    async function writeNewLanguage() {
      try {
        await databaseImports.changeData(message.author.id, args[0].toUpperCase(), `UPDATE data SET language = ? WHERE discordID = ?`);
        return message.channel.send(`${message.author}, your whitelisted language on Hypixel is now set to ${args[0].toUpperCase()}.`);
      } catch (err) {
        console.log(`ERROR_3: ${err}`);
        message.channel.send(`An error occured while writing data. Please report this. ERROR_3: \`${err}\``);
      }
    
    };
    
    async function currentVersion() {
      try {
        let response = await databaseImports.getData(message.author.id)

        return message.channel.send(`${message.author}, your whitelisted language on Hypixel is set to ${response.language}.`);
      } catch (err) {
        console.log(`ERROR_3: ${err}`);
        message.channel.send(`An error occured while fetching data. Please report this. ERROR_3: \`${err}\``);
      }
    };
    
   
	},
};
