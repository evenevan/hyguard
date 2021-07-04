const Discord = require('discord.js');
const fs = require('fs');
const userConfig = require('../../userConfig.json');
const prefix = userConfig["prefix"]
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
	execute(message, args, client, row) {
  if (row !== undefined) {
      var tzOffset = (row.timezone * 3600000);
      var timeString = new Date(Date.now() + tzOffset).toLocaleTimeString('en-IN', { hour12: true }); 
      var dateString = new Date(Date.now() + tzOffset).toLocaleDateString('en-IN', { hour12: true });
      var isInDatabase = true;
  } else {
      var tzOffset = 0
      var timeString = `${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC`
      var dateString = new Date().toLocaleDateString('en-IN', { hour12: true });
      var isInDatabase = false;
  }

  const readData = funcImports.readOwnerSettings();
  const api = readData.api;

  const author = message.author

try {
	message.channel.send('Loading..').then(async msg => {

		if (api == false) {
			msg.delete();
			return message.channel.send(`${message.author}, this command is temporarily disabled as the API is down!`).then(async msg => {
				setTimeout(() => {
					msg.delete()
				}, 10000)
			});
		}


		if (!/^[\w+]{1,16}$/gm.test(args[0]) && args[0]) {
			msg.delete();
			return message.channel.send(`${message.author}, that doesn't seem to be a valid Minecraft username!`).then(async msg => {
				setTimeout(() => {
					msg.delete();
				}, 10000);
			});
		}

		if (!args[0] && row == undefined) {
			msg.delete();
			return message.channel.send(`${message.author}, you are not signed up and you did not include a player name!`).then(async msg => {
				setTimeout(() => {
					msg.delete();
				}, 10000);
			});
		}

		if (row !== undefined && !args[0]) {
			mojangAPIGetUsername();
		} else if (args[0]) {
			slothPixelGetUUID();
		}


		function mojangAPIGetUsername() {

			fetchTimeout(`https://api.mojang.com/user/profiles/${row.minecraftUUID}/names`, 2000, {
					signal: controller.signal
				})
				.then(res => res.json())
				.then((response) => {
					if (response.hasOwnProperty('error')) {
						msg.delete();
						return message.channel.send(`${message.author}, that username doesn\'t seem to be valid.`).then(async msg => {
							setTimeout(() => {
								msg.delete();
							}, 10000);
						});
					}
					recentGameAPI(row.minecraftUUID, response[response.length - 1].name)
				})
				.catch((err) => {
					if (err.name === "AbortError") {
						msg.delete();
						message.channel.send(`${message.author}, an error occured while executing this command. The API failed to respond, and may be down. Try again later.`);
					} else {
						msg.delete();
						console.log(`API Error 9: ${err}`);
						message.channel.send(`${message.author}, an error occured while executing this command. This error is expected to occur occasionally. Please report this if it continues. ERROR_9: \`${err}\``);
					}
				});
		};

		function slothPixelGetUUID() {

			fetchTimeout(`https://api.slothpixel.me/api/players/${args[0] ? `${args[0]}` : `${row.minecraftUUID}`}`, 2000, {
					signal: controller.signal
				})
				.then(res => res.json())
				.then((response) => {
					if (response.hasOwnProperty('error')) {
						msg.delete();
						return message.channel.send(`${message.author}, that username doesn\'t seem to be valid.`).then(async msg => {
							setTimeout(() => {
								msg.delete();
							}, 10000);
						});
					}
					recentGameAPI(response.uuid, response.username)
				})
				.catch((err) => {
					if (err.name === "AbortError") {
						msg.delete();
						message.channel.send(`${message.author}, an error occured while executing this command. The API failed to respond, and may be down. Try again later. https://status.hypixel.net/`);
					} else {
						msg.delete();
						console.log(`API Error 9: ${err}`);
						message.channel.send(`${message.author}, an error occured while executing this command. This error is expected to occur occasionally. Please report this if it continues. ERROR_9: \`${err}\``);
					}
				});
		};

		function recentGameAPI(playerUUID, playerUsername) {

			fetchTimeout(`https://api.slothpixel.me/api/players/${playerUUID}/recentGames`, 2000, {
					signal: controller.signal
				})
				.then(recentData => recentData.json())
				.then((recentData) => {

					if (recentData.hasOwnProperty('error')) {
						return message.channel.send(`${message.author}, there was an error while trying to retrieve your requested information. Error: ${json.cause.toUpperCase()}`).then(async msg => {
							setTimeout(() => {
								msg.delete()
							}, 10000)
						});
					}

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
							.setFooter(`Executed at ${dateString} | ${timeString}`, 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/e/e9/Book_and_Quill_JE2_BE2.png/revision/latest/scale-to-width-down/160?cb=20190530235621');
						return message.channel.send(noDataEmbed);
					}


					const generateEmbed = start => {
						const current = recentData.slice(start, start + 5);

						const recentGamesEmbed = new Discord.MessageEmbed()
							.setColor('#7289DA')
							.setTitle(`**Recent Games - ${playerUsername} | Showing ${start + 1}-${start + current.length} out of ${recentData.length}**`)
							.setDescription(`Some gametypes like Skyblock will not show up due to limitations with Hypixel's API. Games may take a while to appear here due to use of the Slothpixel API.`)
							.setFooter(`Executed at ${dateString} | ${timeString}`, 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/e/e9/Book_and_Quill_JE2_BE2.png/revision/latest/scale-to-width-down/160?cb=20190530235621');
						for (let i = start; i < start + 5; i++) {
							if (recentData[i]) {
								recentGamesEmbed.addField(`${recentData[i].gameType} | ${new Date(recentData[i].date).toLocaleDateString('en-IN', { hour12: true })} | ${isInDatabase ? `UTC ${decimalsToUTC(row.timezone)}` : `UTC ±0`}`, `${recentData[i].hasOwnProperty("date") && recentData[i].date !== null && recentData[i].date !== "" ? `Game Start: ${new Date(recentData[i].date + tzOffset).toLocaleTimeString('en-IN', { hour12: true })}\n` : `Game Start: Unknown\n`}${recentData[i].hasOwnProperty('ended') && recentData[i].ended !== null && recentData[i].ended !== "" ? `Game End: ${new Date(recentData[i].ended).toLocaleTimeString('en-IN', { hour12: true })}\n` : `Game End: In progress\n` }${recentData[i].hasOwnProperty('ended') && recentData[i].ended !== null && recentData[i].ended !== "" ? `Play Time: ${new Date(recentData[i].ended - recentData[i].date).toISOString().substr(11, 8)}\n` : `Play Time Elapsed: ${new Date(new Date() - recentData[i].date).toISOString().substr(11, 8)}\n` }${recentData[i].mode !== null && recentData[i].mode !== "" ? `Mode: ${recentData[i].mode}\n` : `` }${recentData[i].map !== null && recentData[i].map !== "" ? `Map: ${recentData[i].map}` : `` }`)
							}
						}
						return recentGamesEmbed;
					}

					msg.delete();
					message.channel.send(generateEmbed(0)).then(message => {
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
					})
				})
				.catch((err) => {
					if (err.name === "AbortError") {
						msg.delete();
						message.channel.send(`${message.author}, an error occured while executing this command. The API failed to respond, and may be down. Try again later. https://status.hypixel.net/`);
					} else {
						msg.delete();
						console.log(`API Error 9: ${err}`);
						message.channel.send(`${message.author}, an error occured while executing this command. This error is expected to occur occasionally. Please report this if it continues. ERROR_9: \`${err}\``);
					}
				});

		};
	});
} catch (err) {
	console.log(`Error 11: ${err}`)
	message.channel.send(`An unknown error occured. Please report this. ERROR_11: \`${err}\``);
}
	},
};
