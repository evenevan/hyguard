const fs = require('fs');
const { prefix } = require('../../userConfig.json');
const databaseImports = require('../../databaseFuncs');
const funcImports = require( __dirname + '../../../functions');
module.exports = {
	name: 'version',
  title: 'Set a whitelisted version of Minecraft',
	description: `Allows you to whitelist a version of Minecraft for use on Hypixel! Use \`${prefix}version current\` to see your current version, or use \`${prefix}version <version>\` to set a new one.`,
  usage: `\`${prefix}version <version>\`, \`${prefix}version current\``,
  args: true,
  database: true,
  cooldown: 5,
	execute(message, args, client, row) {

    const readData = funcImports.readConstants();
    const versions = readData.versions;
    
    
    if (args[0].toLowerCase() == 'current') {
      return currentVersion();
    } else if (!versions.includes(`${/[a-zA-Z]/g.test(args[0]) ? `${args[0].toUpperCase()}` : `${args[0]}`}`)) {
      return message.channel.send(`${message.author}, that isn't a valid version! Please select a valid version of Minecraft. Reference: <https://support.hypixel.net/hc/en-us/articles/360019634940-Changing-Minecraft-Versions> `).then(async msg => {
        setTimeout(() => {
          msg.delete();
        }, 10000);
      });
    } else {
      checkVersion();
    }
    
    async function checkVersion() {
      try {
        let response = await databaseImports.getData(message.author.id);
    
        if (args[0].toUpperCase() == response.version) return message.channel.send(`${message.author}, your whitelisted version on Hypixel was already set to ${/[a-zA-Z]/g.test(args[0]) ? `${args[0].toUpperCase()}` : `${args[0]}`}!`).then(async msg => {
          setTimeout(() => {
            msg.delete();
          }, 10000);
        });
    
        writeNewVersion();
    
      } catch (err) {
        console.log(`ERROR_3: ${err}`);
        message.channel.send(`An error occured while fetching data. Please report this. ERROR_3: \`${err}\``);
      }
    };
    
    async function writeNewVersion() {
      try {
        await databaseImports.changeData(message.author.id, `${/[a-zA-Z]/g.test(args[0]) ? `${args[0].toUpperCase()}` : `${args[0]}`}`, `UPDATE data SET version = ? WHERE discordID = ?`);
        return message.channel.send(`${message.author}, your whitelisted version of Minecraft on Hypixel is now set to ${args[0]}.`)
      } catch (err) {
        console.log(`ERROR_3: ${err}`);
        message.channel.send(`An error occured while writing data. Please report this. ERROR_3: \`${err}\``);
      }
    
    };
    
    async function currentVersion() {
      try {
        let response = await databaseImports.getData(message.author.id);
        return message.channel.send(`${message.author}, your whitelisted version on Hypixel is set to ${response.version}.`);
      } catch (err) {
        console.log(`ERROR_3: ${err}`);
        message.channel.send(`An error occured while fetching data. Please report this. ERROR_3: \`${err}\``);
      }
    };
    
        
	},
};