const fs = require('fs');
const { prefix } = require('../../userConfig.json');
const databaseImports = require('../../databaseFuncs');
const Discord = require('discord.js');
const funcImports = require( __dirname + '../../../functions');
module.exports = {
	name: 'blacklist',
  title: 'Set blacklisted games types for Hypixel',
	description: 'Allows you to set blacklist games on Hypixel. Games detected that are blacklisted will set off a red alert. Use <https://api.hypixel.net/#section/Introduction/GameTypes> to find the database name of the game.',
  usage: `\`${prefix}blacklist add/remove <game>\`, \`${prefix}blacklist current\``,
  args: true,
  database: true,
  cooldown: 2.5,
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

    let readData = funcImports.readConstants();
    let gametypes = readData.gametypes;

    let games = gametypes

    if (args[0].toLowerCase() == 'current') {

      return currentBlacklist();
    } else if (!/^[a-zA-Z_]+$/.test(args[0])) {

      return message.channel.send(`${message.author}, you cannot use any characters that are not letters or underscores! `).then(async msg => {
      setTimeout(() => {msg.delete();}, 10000);});
    } else if (args[0].toLowerCase() !== "add" && args[0].toLowerCase() !== "remove") {

      return message.channel.send(`${message.author}, that isn't a valid instruction! Use \`${prefix}help blacklist\` to find valid arguments!`).then(async msg => {
        setTimeout(() => {
          msg.delete();
        }, 10000);
      });
    } else if (!args[1]) {

      return message.channel.send(`${message.author}, you didn't specify any game type! Use this link <https://api.hypixel.net/#section/Introduction/GameTypes> to find the clean name of your game: ${games.join(`, `)}`).then(async msg => {
      setTimeout(() => {msg.delete();}, 30000);});
    } else if (!games.includes(args[1].toUpperCase())) {

      return message.channel.send(`${message.author}, that doesn't seem to be a valid game type! Use this link <https://api.hypixel.net/#section/Introduction/GameTypes> to find the clean name of your game. Valid gametypes: ${games.join(`, `)}`).then(async msg => {
        setTimeout(() => {
          msg.delete();
        }, 30000);
      });
    } else {
      checkBlacklist();
    }

    async function checkBlacklist() {
  try {
        let response = await databaseImports.getData(message.author.id)     

        if (response.blacklist) {
          var blacklistResponse = response.blacklist.split(" ");
        } else {
          var blacklistResponse = [];
        }

        if (response.whitelist) {
          var whitelist = response.whitelist.split(" ");
        } else {
          var whitelist = [];
        }

    if (args[0] == 'add') {
      
        if (blacklistResponse.includes(args[1].toUpperCase())) return message.channel.send(`${message.author}, that game type was already added!`).then(async msg => {
          setTimeout(() => {
            msg.delete();
          }, 10000);
        });

        blacklistResponse.push(`${args[1].toUpperCase()}`)
 
        let combinedArrays = whitelist.concat(blacklistResponse);
        let hasDuplicates = new Set(combinedArrays).size < combinedArrays.length;

        if (hasDuplicates) return message.channel.send(`${message.author}, that game was added to your whitelist. You cannot add a game to both.`).then(async msg => {
            setTimeout(() => {
              msg.delete();
            }, 10000);
          });

        if (blacklistResponse.length == 1) changeAlertState(response);
        writeNewBlacklist(blacklistResponse);

    } else if (args[0] == 'remove') {

        let findAndRemove = blacklistResponse.indexOf(args[1].toUpperCase());

        if (findAndRemove == -1) return message.channel.send(`${message.author}, you cannot unblacklist a game that wasn\'t already added!`).then(async msg => {
          setTimeout(() => {
            msg.delete();
          }, 10000);
        });

        blacklistResponse.splice(findAndRemove, 1);

        if (blacklistResponse.length == 0) changeAlertState(response);
        writeNewBlacklist(blacklistResponse);
          
    }
  } catch (err) {
        console.log(`ERROR_3: ${err}`);
        message.channel.send(`An error occured while fetching data. Please report this. ERROR_3: \`${err}\``);
  }
};

    async function changeAlertState(data) {
        let alertsData = data.alerts.split(" ");

        if (args[0] == 'remove') {
          alertsData[0] = 0;
        } else if (args[0] == 'add') {
          alertsData[0] = 1;
        }
          
        try {
          await databaseImports.changeData(message.author.id, alertsData.join(" "), `UPDATE data SET alerts = ? WHERE discordID = ?`);
        } catch (err) {
          console.log(`ERROR_3: ${err}`);
          message.channel.send(`An error occured while writing data. Please report this. ERROR_3: \`${err}\``);
        }
};

    async function writeNewBlacklist(blacklist) {
  try {
        await databaseImports.changeData(message.author.id, blacklist.join(" ").toUpperCase(), `UPDATE data SET blacklist = ? WHERE discordID = ?`);

    if (args[0] == 'add') {

          let blacklistedData = new Discord.MessageEmbed()
            .setColor('#7289DA')
            .setTitle(`${args[1].toUpperCase()} has been added!`)
            .setFooter(`Executed at ${dateString} | ${timeString}`, 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/e/e9/Book_and_Quill_JE2_BE2.png/revision/latest/scale-to-width-down/160?cb=20190530235621')
            .addField(`${message.author.tag}'s blacklisted game(s)`, `${blacklist === undefined || blacklist == 0 ? `No blacklisted games found!` : `${blacklist.join(`, `).toUpperCase()}`}`);
          if (blacklist.length == 1) blacklistedData.setDescription(`Your blacklisted games alert is now on! If you want to turn them off, use \`${prefix}alert blacklist\``);
          return message.reply(blacklistedData);

    } else if (args[0] == 'remove') {
          let blacklistedData = new Discord.MessageEmbed()
            .setColor('#7289DA')
            .setTitle(`${args[1].toUpperCase()} has been removed!`)
            .setFooter(`Executed at ${dateString} | ${timeString}`, 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/e/e9/Book_and_Quill_JE2_BE2.png/revision/latest/scale-to-width-down/160?cb=20190530235621')
            .addField(`${message.author.tag}'s blacklisted game(s)`, `${blacklist === undefined || blacklist == 0 ? `No blacklisted games found!` : `${blacklist.join(`, `).toUpperCase()}`}`);
          if (blacklist.length == 0) blacklistedData.setDescription(`Your blacklisted games alert is now off, as you have no blacklisted games.`);
          return message.reply(blacklistedData);
    }
  } catch (err) {
        console.log(`ERROR_3: ${err}`);
        message.channel.send(`An error occured while writing data. Please report this. ERROR_3: \`${err}\``);
  }

};

    async function currentBlacklist() {
      try {
        let row = await databaseImports.getData(message.author.id)     

        if (row.blacklist) {
          var blacklistResponse = row.blacklist.split(" ");
        } else {
          var blacklistResponse = [];
        }

        let blacklistedData = new Discord.MessageEmbed()
          .setColor('#7289DA')
          .setTitle(`${message.author.tag}'s Blacklisted Games`)
          .setFooter(`Executed at ${dateString} | ${timeString}`, 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/e/e9/Book_and_Quill_JE2_BE2.png/revision/latest/scale-to-width-down/160?cb=20190530235621')
          .addField(`Your blacklisted game(s)`, `${!blacklistResponse || blacklistResponse == 0 ? `No blacklisted games found!` : `${blacklistResponse.join(`, `).toUpperCase()}`}`);
        return message.reply(blacklistedData);
      } catch (err) {
        console.log(`ERROR_3: ${err}`);
        message.channel.send(`An error occured while fetching data. Please report this. ERROR_3: \`${err}\``);
      }
    };
	},
};