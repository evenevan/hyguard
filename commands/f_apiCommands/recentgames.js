const Discord = require('discord.js');
const fs = require('fs');
const userConfig = require('../../userConfig.json');
const hypixelAPIkey = userConfig["hypixelAPIkey"];
const prefix = userConfig["prefix"];
const fetch = require('node-fetch');
const funcImports = require( __dirname + '../../../functions');
const controller = new AbortController();
const fetchTimeout = (url, ms, { signal, ...options } = {}) => {
const controller = new AbortController();
const promise = fetch(url, { signal: controller.signal, ...options });
if (signal) signal.addEventListener("abort", () => controller.abort());
const timeout = setTimeout(() => controller.abort(), ms);
return promise.finally(() => clearTimeout(timeout));
  };
module.exports = {
	name: 'recentgames',
  aliases: ['recent'],
  title: 'Shows the recent games of any player',
	description: `Shows the most recent games of any player. Games beyond 3 days ago cannot be shown. Doing \`${prefix}recentgames\` without arguments will show your own data. As this command uses the Slothpixel API over the Hypixel API, the data is slightly delayed and may not be accurate.`,
  usage: `\`${prefix}recentgames\`,\`${prefix}recentgames <player>\``,
  args: false,
  database: false,
  cooldown: 7.5,
  permissions: ["ADD_REACTIONS","VIEW_CHANNEL","SEND_MESSAGES","MANAGE_MESSAGES","EMBED_LINKS","READ_MESSAGE_HISTORY"],
	execute(message, args, client, row) {
  if (row !== undefined) {
    var tzOffset = (row.timezone * 3600000);
	var timeString = new Date(Date.now() + tzOffset).toLocaleTimeString('en-IN', { hour12: true }); 
	var dateString = funcImports.epochToCleanDate(new Date(Date.now() + tzOffset));
    var isInDatabase = true;
  } else {
    var tzOffset = 0
	var timeString = `${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC`
	var dateString = funcImports.epochToCleanDate(new Date());
    var isInDatabase = false;
  }

  const readData = funcImports.readOwnerSettings();
  const api = readData.api;

  const author = message.author

try {
	message.channel.send('Loading..').then(async msg => {

		if (api == false) {
			msg.delete();
			return message.channel.send(`${message.author}, this command is temporarily disabled as the API is down!`);
		}


		if (!/^[\w+]{1,16}$/gm.test(args[0]) && args[0]) {
			msg.delete();
			return message.channel.send(`${message.author}, that doesn't seem to be a valid Minecraft username!`);
		}

		if (!args[0] && row == undefined) {
			msg.delete();
			return message.channel.send(`${message.author}, you are not signed up and you did not include a player name!`);
		}

		if (row !== undefined && !args[0]) {
			mojangAPIGetUsername();
		} else if (args[0]) {
			mojangAPIGetUUID();
		}

		function mojangAPIGetUsername() {

			fetchTimeout(`https://api.mojang.com/user/profiles/${row.minecraftUUID}/names`, 2000, {
					signal: controller.signal
				})
				.then(function(response) {
					if (response.status == 204) {
						return 204
					}
					if (!response.ok) {throw new Error("HTTP status " + response.status);}
					return response.json();
				  })
				.then((response) => {
					if (response == 204) {
						msg.delete();
						return message.channel.send(`${message.author}, your UUID doesn\'t seem to be valid.`);
					}
					recentGameAPI(row.minecraftUUID, response[response.length - 1].name)
				})
				.catch((err) => {
					if (err.name === "AbortError") {
						msg.delete();
						message.channel.send(`${message.author}, an error occured while executing this command. The API failed to respond and may be down. Try again later.`);
					} else {
						msg.delete();
						console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | Mojang API Error 9: ${err}`);
						message.channel.send(`${message.author}, Mojang API Error: An error occured while executing this command. \`${err}\``);
					}
				});
		};

		function mojangAPIGetUUID() {
  
			fetchTimeout(`https://api.mojang.com/users/profiles/minecraft/${args[0]}`, 2000, {
					signal: controller.signal
				})
				.then(function(response) {
					if (response.status == 204) {
						return 204
					}
					if (!response.ok) {throw new Error("HTTP status " + response.status);}
					return response.json();
				  })
				.then((response) => {
					if (response == 204) {
						msg.delete();
						return message.channel.send(`${message.author}, that username doesn\'t seem to be valid.`);
					}
					recentGameAPI(response.id, response.name);
				})
				.catch((err) => {
					if (err.name === "AbortError") {
						msg.delete();
						message.channel.send(`${message.author}, an error occured while executing this command. The Mojang API failed to respond and may be down. Try again later.`);
					} else {
						msg.delete();
						console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | Mojang API Error 9: ${err}`);
						message.channel.send(`${message.author}, Mojang API Error: An error occured while executing this command. \`${err}\``);
					}
				});
		};

		function recentGameAPI(playerUUID, playerUsername) {

			fetchTimeout(`https://api.slothpixel.me/api/players/${playerUUID}/recentGames`, 2000, {
					signal: controller.signal
				})
				.then(function(response) {
					if (response.status == 204) return message.channel.send(`${message.author}, that username doesn\'t seem to be valid.`);
					if (!response.ok) {throw new Error("HTTP status " + response.status);}
					return response.json();
				  })
				.then((recentData) => {

					function decimalsToUTC(decimal) {
						if (/\./.test(decimal)) {
							let decimalArray = decimal.toString().split(".");
							let hour = decimalArray[0] * 1;
							let minutes = Math.round((`0.${(decimalArray[1])}`) * 60);
							if (hour < 0) return hour + ":" + (minutes * 1).toFixed(2).slice(0, -3);
							return "+" + hour + ":" + (minutes * 1).toFixed(2).slice(0, -3);
						} else {
							if (decimal < 0) return decimal;
							return "+" + decimal;
						}
					};

					if (!recentData[0]) {
						let noDataEmbed = new Discord.MessageEmbed()
							.setColor('#7289DA')
							.setTitle(`**Most Recent Games - ${playerUsername}**`)
							.addField(`No Recent Games Detected!`, `There are no recent games to show. Games played more than 3 days ago cannot be shown. Some players also have the recent games API option disabled.`)
							.setFooter(`Executed at ${dateString} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');
						return message.channel.send(noDataEmbed);
					}


					const generateEmbed = start => {
						const current = recentData.slice(start, start + 5);

						const recentGamesEmbed = new Discord.MessageEmbed()
							.setColor('#7289DA')
							.setTitle(`**Recent Games - ${playerUsername} | Showing ${start + 1}-${start + current.length} out of ${recentData.length}**`)
							.setDescription(`Some gametypes like Skyblock will not show up due to limitations with Hypixel's API. Games may take a while to appear here due to use of the Slothpixel API.`)
							.setFooter(`Executed at ${dateString} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');
						for (let i = start; i < start + 5; i++) {
							if (recentData[i]) {
								recentGamesEmbed.addField(`${recentData[i].gameType} | ${funcImports.epochToCleanDate(new Date(recentData[i].date+ tzOffset))} | ${isInDatabase ? `UTC ${decimalsToUTC(row.timezone)}` : `UTC ±0`}`, `${recentData[i].hasOwnProperty("date") && recentData[i].date !== null && recentData[i].date !== "" ? `Game Start: ${new Date(recentData[i].date + tzOffset).toLocaleTimeString('en-IN', { hour12: true })}\n` : `Game Start: Unknown\n`}${recentData[i].hasOwnProperty('ended') && recentData[i].ended !== null && recentData[i].ended !== "" ? `Game End: ${new Date(recentData[i].ended + tzOffset).toLocaleTimeString('en-IN', { hour12: true })}\n` : `Game End: In progress\n` }${recentData[i].hasOwnProperty('ended') && recentData[i].ended !== null && recentData[i].ended !== "" ? `Play Time: ${new Date(recentData[i].ended - recentData[i].date).toISOString().substr(11, 8)}\n` : `Play Time Elapsed: ${new Date(new Date() - recentData[i].date).toISOString().substr(11, 8)}\n` }${recentData[i].mode !== null && recentData[i].mode !== "" ? `Mode: ${recentData[i].mode}\n` : `` }${recentData[i].map !== null && recentData[i].map !== "" ? `Map: ${recentData[i].map}` : `` }`)
							}
						}
						return recentGamesEmbed;
					}

					msg.delete();
					message.channel.send(generateEmbed(0)).then(message => {
						if (message.channel.type === 'dm') return message.channel.send(`This is a work in progress. Recent games in DMs does not currently work correctly. Please use a channel.`);
						if (recentData.length <= 5) return
						message.react('➡️');
						const collector = message.createReactionCollector(
							(reaction, user) => ['⬅️', '➡️'].includes(reaction.emoji.name) && user.id === author.id, {
								time: 300000
							}
						)

						let currentIndex = 0
						collector.on('collect', reaction => {

								message.reactions.removeAll().then(async() => {
									reaction.emoji.name === '⬅️' ? currentIndex -= 5 : currentIndex += 5;
	
									message.edit(generateEmbed(currentIndex));
	
									if (currentIndex > 0) await message.react('⬅️');
									if (currentIndex + 5 < recentData.length) message.react('➡️');
								})
							
						})

						collector.on('end', () => { //my brain is dead
							message.reactions.removeAll();
						});
					})
				})
				.catch((err) => {
                  if (err.name === "AbortError") {
                      message.channel.send(`Slothpixel API failed, changing to Hypixel API.`);
                      hypixelRecentGamesCall(playerUUID, playerUsername);
                  } else {
                      msg.delete();
                      console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | Slothpixel API Error 9: ${err}`);
                      message.channel.send(`${message.author}, Slothpixel API Error: An error occured while executing this command. \`${err}\``);
                  }
              	});

		};

		function hypixelRecentGamesCall(playerUUID, playerUsername) { //duplicating it just makes it easier to manage

			fetchTimeout(`https://api.hypixel.net/recentgames?uuid=${playerUUID}&key=${hypixelAPIkey}`, 2000, {
					signal: controller.signal
				})
				.then(function(response) {
					if (!response.ok) {throw new Error("HTTP status " + response.status);}
					return response.json();
				  })
				.then((recentData) => {

					function decimalsToUTC(decimal) {
						if (/\./.test(decimal)) {
							let decimalArray = decimal.toString().split(".");
							let hour = decimalArray[0] * 1;
							let minutes = Math.round((`0.${(decimalArray[1])}`) * 60);
							if (hour < 0) return hour + ":" + (minutes * 1).toFixed(2).slice(0, -3);
							return "+" + hour + ":" + (minutes * 1).toFixed(2).slice(0, -3);
						} else {
							if (decimal < 0) return decimal;
							return "+" + decimal;
						}
					};

					if (!recentData.games[0]) {
						let noDataEmbed = new Discord.MessageEmbed()
							.setColor('#7289DA')
							.setTitle(`**Most Recent Games - ${playerUsername}**`)
							.addField(`No Recent Games Detected!`, `There are no recent games to show. Games played more than 3 days ago cannot be shown. Some players also have the recent games API option disabled.`)
							.setFooter(`Executed at ${dateString} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');
						return message.channel.send(noDataEmbed);
					}


					const generateEmbed = start => {
						const current = recentData.games.slice(start, start + 5);

						const recentGamesEmbed = new Discord.MessageEmbed()
							.setColor('#7289DA')
							.setTitle(`**Recent Games - ${playerUsername} | Showing ${start + 1}-${start + current.length} out of ${recentData.games.length}**`)
							.setDescription(`Some gametypes like Skyblock will not show up due to limitations with Hypixel's API. This data was gathered with the Hypixel API as the Slothpixel API did not respond.`)
							.setFooter(`Executed at ${dateString} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');
						for (let i = start; i < start + 5; i++) {
							if (recentData.games[i]) {
								recentGamesEmbed.addField(`${recentData.games[i].gameType} | ${funcImports.epochToCleanDate(new Date(recentData.games[i].date + tzOffset))} | ${isInDatabase ? `UTC ${decimalsToUTC(row.timezone)}` : `UTC ±0`}`, `${recentData.games[i].hasOwnProperty("date") && recentData.games[i].date !== null && recentData.games[i].date !== "" ? `Game Start: ${new Date(recentData.games[i].date + tzOffset).toLocaleTimeString('en-IN', { hour12: true })}\n` : `Game Start: Unknown\n`}${recentData.games[i].hasOwnProperty('ended') && recentData.games[i].ended !== null && recentData.games[i].ended !== "" ? `Game End: ${new Date(recentData.games[i].ended + tzOffset).toLocaleTimeString('en-IN', { hour12: true })}\n` : `Game End: In progress\n` }${recentData.games[i].hasOwnProperty('ended') && recentData.games[i].ended !== null && recentData.games[i].ended !== "" ? `Play Time: ${new Date(recentData.games[i].ended - recentData.games[i].date).toISOString().substr(11, 8)}\n` : `Play Time Elapsed: ${new Date(new Date() - recentData.games[i].date).toISOString().substr(11, 8)}\n` }${recentData.games[i].mode !== null && recentData.games[i].mode !== "" ? `Mode: ${recentData.games[i].mode}\n` : `` }${recentData.games[i].map !== null && recentData.games[i].map !== "" ? `Map: ${recentData.games[i].map}` : `` }`)
							}
						}
						return recentGamesEmbed;
					}

					msg.delete();
					message.channel.send(generateEmbed(0)).then(message => {
						if (recentData.games.length <= 5) return;
						message.react('➡️');
						const collector = message.createReactionCollector(
							(reaction, user) => ['⬅️', '➡️'].includes(reaction.emoji.name) && user.id === author.id, {
								time: 300000
							}
						)

						let currentIndex = 0
						collector.on('collect', reaction => {

							if (message.channel.type === 'dm') {

								message.channel.send(`This is a work in progress. Recent games in DMs does not currently work correctly.`)
								collector.stop()
								
							} else {
								message.reactions.removeAll().then(async() => {
									reaction.emoji.name === '⬅️' ? currentIndex -= 5 : currentIndex += 5;
	
									message.edit(generateEmbed(currentIndex));
	
									if (currentIndex > 0) await message.react('⬅️');
									if (currentIndex + 5 < recentData.games.length) message.react('➡️');
								})
							}
						})

						collector.on('end', () => { //my brain is dead
							message.reactions.removeAll();
						});
					})
				})
				.catch((err) => {
					if (err.name === "AbortError") {
						msg.delete();
						message.channel.send(`${message.author}, an error occured while executing this command. The API failed to respond and may be down. Try again later. https://status.hypixel.net/`);
					} else {
						msg.delete();
						console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | Hypixel API Error 9: ${err}`);
						message.channel.send(`${message.author}, Hypixel API Error: An error occured while executing this command. \`${err}\``);
					}
				  });
		}
	}); 
} catch (err) {
	console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | Something went very wrong outside of a promise catch. ${err}`)
	message.channel.send(`${message.author}, something went very wrong outside of a promise catch. Please report this. \`${err}\``);
}
	},
};
