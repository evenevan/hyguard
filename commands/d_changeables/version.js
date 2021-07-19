const fs = require('fs');
const { prefix } = require('../../userConfig.json');
const databaseImports = require('../../databaseFuncs');
const funcImports = require( __dirname + '../../../functions');
const Discord = require('discord.js');
module.exports = {
	name: 'version',
  title: `Set a whitelisted version of Minecraft`,
	description: `Allows you to whitelist version(s) of Minecraft for use on Hypixel! Use \`${prefix}version current\` to see your current version, or use \`${prefix}version <version>\` to add/remove one`,
  usage: `\`${prefix}version <version>\`, \`${prefix}version current\``,
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

        let version = response.version.split(" ");
        
    
        if (version.includes(args[0])) {
          let findAndRemove = version.indexOf(args[0]);
          version.splice(findAndRemove, 1);
          if (version.length == 0) return message.channel.send(`${message.author}, you must have atleast 1 whitelisted version!`)
          return writeNewVersion(version);
        }
        
        
        version.push(args[0])
        writeNewVersion(version);
    
      } catch (err) {
        console.log(`ERROR_3: ${err}`);
        message.channel.send(`An error occured while fetching data. Please report this. ERROR_3: \`${err}\``);
      }
    };
    
    async function writeNewVersion(version) {
      try {
        await databaseImports.changeData(message.author.id, `${version.join(" ")}`, `UPDATE data SET version = ? WHERE discordID = ?`);
        return message.channel.send(`${message.author}, your whitelisted version(s) of Minecraft on Hypixel is now set to ${version.join(`, `)}.`)
      } catch (err) {
        console.log(`ERROR_3: ${err}`);
        message.channel.send(`An error occured while writing data. Please report this. ERROR_3: \`${err}\``);
      }
    
    };
    
    async function currentVersion() {
      try {
        let response = await databaseImports.getData(message.author.id);

        
        let version = response.version.split(" ");
        

        let versionData = new Discord.MessageEmbed()
          .setColor('#7289DA')
          .setTitle(`${message.author.tag}'s whitelisted version(s)`)
          .setFooter(`Executed at ${dateString} | ${timeString}`, 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/e/e9/Book_and_Quill_JE2_BE2.png/revision/latest/scale-to-width-down/160?cb=20190530235621')
          .addField(`Your version(s)`, `${version.join(`, `)}`);
        return message.reply(versionData);
      } catch (err) {
        console.log(`ERROR_3: ${err}`);
        message.channel.send(`An error occured while fetching data. Please report this. ERROR_3: \`${err}\``);
      }
    };
    
        
	},
};