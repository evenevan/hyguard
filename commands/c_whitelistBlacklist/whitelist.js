const fs = require('fs');
const { prefix } = require('../../userConfig.json');
const Discord = require('discord.js');
const funcImports = require( __dirname + '../../../functions');
const databaseImports = require('../../databaseFuncs');
module.exports = {
	name: 'whitelist',
  title: 'Set whitelisted game types for Hypixel',
	description: 'Allows you to set whitelisted game to play on Hypixel. Games detected that are not whitelisted will set off an orange alert. Use <https://api.hypixel.net/#section/Introduction/GameTypes> to find the database name of the game.',
  usage: `\`${prefix}whitelist add/remove <game>\`, \`${prefix}whitelist current\``,
  args: true,
  database: true,
  cooldown: 2.5,
	execute(message, args, client, row) {
if (row !== undefined) {
	var tzOffset = (row.timezone * 3600000);
	var timeString = new Date(Date.now() + tzOffset).toLocaleTimeString('en-IN', { hour12: true }); 
	var dateString = new Date(Date.now() + tzOffset).toLocaleDateString('en-IN', { hour12: true });  
  } else {
	var tzOffset = 0
	var timeString = `${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC`
	var dateString = new Date().toLocaleDateString('en-IN', { hour12: true });
  }

  let readData = funcImports.readConstants();
  let gametypes = readData.gametypes;

  let games = gametypes;

  if (args[0].toLowerCase() == 'current') {

	return currentWhitelist();
  } else if (!/^[a-zA-Z_]+$/.test(args[0])) {

	return message.channel.send(`${message.author}, you cannot use any characters that are not letters or underscores! `).then(async msg => {
	setTimeout(() => {msg.delete();}, 10000);});
  } else if (args[0].toLowerCase() !== "add" && args[0].toLowerCase() !== "remove") {

	return message.channel.send(`${message.author}, that isn't a valid instruction! Use \`${prefix}help whitelist\` to find valid arguments!`).then(async msg => {
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
	checkWhitelist();
  }

  async function checkWhitelist() {
try {
	  let response = await databaseImports.getData(message.author.id)     

	  if (response.whitelist) {
		var whitelistResponse = response.whitelist.split(" ");
	  } else {
		var whitelistResponse = [];
	  }

	  if (response.blacklist) {
		var blacklist = response.blacklist.split(" ");
	  } else {
		var blacklist = [];
	  }

  if (args[0] == 'add') {
	
	  if (whitelistResponse.includes(args[1].toUpperCase())) return message.channel.send(`${message.author}, that game type was already added!`).then(async msg => {
		setTimeout(() => {
		  msg.delete();
		}, 10000);
	  });

	  whitelistResponse.push(`${args[1].toUpperCase()}`)

	  let combinedArrays = blacklist.concat(whitelistResponse);
	  let hasDuplicates = new Set(combinedArrays).size < combinedArrays.length;

	  if (hasDuplicates) return message.channel.send(`${message.author}, that game was added to your blacklist. You cannot add a game to both.`).then(async msg => {
		  setTimeout(() => {
			msg.delete();
		  }, 10000);
		});

	  if (whitelistResponse.length == 1) changeAlertState(response);
	  writeNewWhitelist(whitelistResponse);

  } else if (args[0] == 'remove') {

	  let findAndRemove = whitelistResponse.indexOf(args[1].toUpperCase());

	  if (findAndRemove == -1) return message.channel.send(`${message.author}, you cannot unwhitelist a game that wasn\'t already added!`).then(async msg => {
		setTimeout(() => {
		  msg.delete();
		}, 10000);
	  });

	  whitelistResponse.splice(findAndRemove, 1);

	  if (whitelistResponse.length == 0) changeAlertState(response);
	  writeNewWhitelist(whitelistResponse);
		
  }
} catch (err) {
	  console.log(`ERROR_3: ${err}`);
	  message.channel.send(`An error occured while fetching data. Please report this. ERROR_3: \`${err}\``);
}
};

  async function changeAlertState(data) {
	  let alertsData = data.alerts.split(" ");

    if (args[0] == 'remove') {
      alertsData[1] = 0;
    } else if (args[0] == 'add') {
      alertsData[1] = 1;
    }
		
	  try {
		await databaseImports.changeData(message.author.id, alertsData.join(" "), `UPDATE data SET alerts = ? WHERE discordID = ?`);
	  } catch (err) {
		console.log(`ERROR_3: ${err}`);
		message.channel.send(`An error occured while writing data. Please report this. ERROR_3: \`${err}\``);
	  }
};

  async function writeNewWhitelist(whitelist) {
try {
	  await databaseImports.changeData(message.author.id, whitelist.join(" ").toUpperCase(), `UPDATE data SET whitelist = ? WHERE discordID = ?`);

  if (args[0] == 'add') {

		let whitelistedData = new Discord.MessageEmbed()
		  .setColor('#7289DA')
		  .setTitle(`${args[1].toUpperCase()} has been added!`)
		  .setFooter(`Executed at ${dateString} | ${timeString}`, 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/e/e9/Book_and_Quill_JE2_BE2.png/revision/latest/scale-to-width-down/160?cb=20190530235621')
		  .addField(`${message.author.tag}'s whitelisted game(s)`, `${whitelist === undefined || whitelist == 0 ? `No whitelisted games found!` : `${whitelist.join(`, `).toUpperCase()}`}`);
		if (whitelist.length == 1) whitelistedData.setDescription(`Your whitelisted games alerts is now on! If you want to turn them off, use \`${prefix}alert whitelist\``);
		return message.reply(whitelistedData);

  } else if (args[0] == 'remove') {
		let whitelistedData = new Discord.MessageEmbed()
		  .setColor('#7289DA')
		  .setTitle(`${args[1].toUpperCase()} has been removed!`)
		  .setFooter(`Executed at ${dateString} | ${timeString}`, 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/e/e9/Book_and_Quill_JE2_BE2.png/revision/latest/scale-to-width-down/160?cb=20190530235621')
		  .addField(`${message.author.tag}'s whitelisted game(s)`, `${whitelist === undefined || whitelist == 0 ? `No whitelisted games found!` : `${whitelist.join(`, `).toUpperCase()}`}`);
		if (whitelist.length == 0) whitelistedData.setDescription(`Your whitelisted games alerts is now off, as you have no whitelisted games.`);
		return message.reply(whitelistedData);
  }
} catch (err) {
	  console.log(`ERROR_3: ${err}`);
	  message.channel.send(`An error occured while writing data. Please report this. ERROR_3: \`${err}\``);
}

};

  async function currentWhitelist() {
	try {
	  let row = await databaseImports.getData(message.author.id)     

	  if (row.whitelist) {
		var whitelistResponse = row.whitelist.split(" ");
	  } else {
		var whitelistResponse = [];
	  }

	  let whitelistedData = new Discord.MessageEmbed()
		.setColor('#7289DA')
		.setTitle(`${message.author.tag}'s Whitelisted Games`)
		.setFooter(`Executed at ${dateString} | ${timeString}`, 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/e/e9/Book_and_Quill_JE2_BE2.png/revision/latest/scale-to-width-down/160?cb=20190530235621')
	  	.addField(`Your whitelisted game(s)`, `${!whitelistResponse || whitelistResponse == 0 ? `No whitelisted games found!` : `${whitelistResponse.join(`, `).toUpperCase()}`}`);
	  return message.reply(whitelistedData);
	} catch (err) {
	  console.log(`ERROR_3: ${err}`);
	  message.channel.send(`An error occured while fetching data. Please report this. ERROR_3: \`${err}\``);
	}
  };
	},
};