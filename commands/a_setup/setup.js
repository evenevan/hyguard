const { prefix } = require('../../userConfig.json');
const funcImports = require( __dirname + '../../../functions');
const sqlite = require('sqlite3').verbose();
const fetch = require('node-fetch');
const Discord = require('discord.js');
const databaseImports = require('../../databaseFuncs');
const fetchTimeout = (url, ms, { signal, ...options } = {}) => {
const controller = new AbortController();
const promise = fetch(url, { signal: controller.signal, ...options });
if (signal) signal.addEventListener("abort", () => controller.abort());
const timeout = setTimeout(() => controller.abort(), ms);
return promise.finally(() => clearTimeout(timeout));
};
module.exports = {
	name: 'setup',
	title: 'Allows players to begin using HyGuard',
	description: 'Allows players to begin using HyGuard. When prompted, send your username. Then, when prompted, send your UTC Offset. Learn more about the UTC Offset at <https://en.wikipedia.org/wiki/List_of_UTC_time_offsets>',
	usage: `\`${prefix}setup\``,
  cooldown: 5,
  args: false,
  database: false,
	execute(message, args, client) {
		const controller = new AbortController();

		const readData = funcImports.readOwnerSettings();
        const api = readData.api,
		userLimit = readData.userLimit,
		blockedUsers = readData.blockedUsers;

		checkSystemLimits();

		async function checkSystemLimits() {
		try {
			if (blockedUsers.includes(message.author.id)) {
				return message.channel.send(`You have been blocked from using this system.`);
			}
			let checkUserLimit = await databaseImports.getUserCount()
			if (checkUserLimit['count(1)'] >= userLimit) return message.channel.send(`${message.author}, the maximum amount of users  of ${userLimit} was reached. Please check back later!`).then(async msg => {
				setTimeout(() => {
				  msg.delete();
				}, 10000);
			  });
			if (api == false) return message.channel.send(`${message.author}, this command is temporarily disabled as the API is down!`).then(async msg => {
				setTimeout(() => {
				  msg.delete();
				}, 10000);
			  });
			isThisPlayerInTheDataBase();		
		} catch (err) {
			console.log(`ERROR_3: ${err}`);
        	message.channel.send(`An error occured while fetching data. Please report this. ERROR_3: \`${err}\``);
		}
	};

		async function isThisPlayerInTheDataBase() { //isn't nessessary if change is made to only execute this command if player isn't in db from index.js
		  try {
			let isInDB = await databaseImports.isInDataBase(message.author.id)
			if (isInDB[0] == true) return message.channel.send(`${message.author}, you have already used this command!`).then(async msg => {
			  setTimeout(() => {
				msg.delete();
			  }, 10000);
			});
			checkMCAccount();
		  } catch (err) {
			console.log(`ERROR_3: ${err}`);
			message.channel.send(`An error occured while fetching data. Please report this. ERROR_3: \`${err}\``);
		  }
		};
	
		function checkMCAccount() {
		  message.channel.send(`${message.author}, welcome! To sign up for LoggerBot, there are 4 steps. First, please send your Minecraft username in this chat.`)
		  message.channel.awaitMessages(m => m.author.id == message.author.id, {
			max: 1,
			time: 60000
		  }).then(collected => {
			let msg = collected.first().content.toLowerCase()
			if (/^[\w+]{1,16}$/gm.test(msg)) {
			  message.channel.send('Loading..').then(async loadingmsg => {
	
				Promise.all([
					fetchTimeout(`https://api.slothpixel.me/api/players/${msg}/`, 2000, {
						signal: controller.signal
					  }).then(player => player.json()),
					fetchTimeout(`https://api.slothpixel.me/api/players/${msg}/status/`, 2000, {
						signal: controller.signal
					  }).then(player => player.json()),
				  ])
				  .then((player) => {
					if (player[0].hasOwnProperty('error')) {
					  loadingmsg.delete();
					  return message.channel.send(`${message.author}, that Minecraft username doesn\'t seem to have exist or hasn\`t logged onto Hypixel. Setup canceled.`).then(async msg => {
						setTimeout(() => {
						  msg.delete();
						}, 10000);
					  });
					}
					if (!player[0].links.DISCORD) {
					  loadingmsg.delete();
					  let linkError = new Discord.MessageEmbed()
						.setColor('#FF5555')
						.setTitle(`Link your Discord on Hypixel!`)
						.setFooter(`Executed at ${new Date().toLocaleDateString()} | ${new Date().toLocaleTimeString()} UTC`, 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/e/e9/Book_and_Quill_JE2_BE2.png/revision/latest/scale-to-width-down/160?cb=20190530235621')
						.setDescription('You have not linked your Discord account to Minecraft account on Hypixel! Follow the guide below:')
						.setImage('https://i.imgur.com/gGKd2s8.gif');
					  return message.reply(linkError).then(async msg => {
						setTimeout(() => {
						  msg.delete();
						}, 60000);
					  });
					}
					if (player[0].links.DISCORD !== message.author.tag) {
					  loadingmsg.delete();
					  let linkError = new Discord.MessageEmbed()
						.setColor('#FF5555')
						.setTitle(`That isn't your account!`)
						.setFooter(`Executed at ${new Date().toLocaleDateString()} | ${new Date().toLocaleTimeString()} UTC`, 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/e/e9/Book_and_Quill_JE2_BE2.png/revision/latest/scale-to-width-down/160?cb=20190530235621')
						.setDescription('If that is your account, follow the guide below to relink it:')
						.setImage('https://i.imgur.com/gGKd2s8.gif');
					  return message.reply(linkError).then(async msg => {
						setTimeout(() => {
						  msg.delete();
						}, 60000);
					  });
					}
	
					loadingmsg.delete();
					verifyTimezone(player);
	
				  })
				  .catch((err) => {
					if (err.name === "AbortError") {
					  loadingmsg.delete();
					  message.channel.send(`${message.author}, an error occured while executing this command. The API failed to respond, and may be down. Try again later. https://status.hypixel.net/`);
					} else {
					  loadingmsg.delete();
					  console.log(`API Error 9: ${err}`);
					  message.channel.send(`${message.author}, an error occured while executing this command. This error is expected to occur occasionally. Please report this if it continues. ERROR_9: \`${err}\``);
					}
				  });
			  })
	
			} else return message.channel.send(`${message.author}, that doesn't seem to be a valid Minecraft username! It cannot contain illegal characters! Setup canceled.`).then(async msg => {
			  setTimeout(() => {
				msg.delete();
			  }, 10000);
			});
	
	
		  }).catch((err) => {
			if (err instanceof TypeError) return message.channel.send(`${message.author}, you did not send your username. Setup canceled.`).then(async msg => {
			  setTimeout(() => {
				msg.delete();
			  }, 60000);
			});
			console.log(`ERROR_4: ${err}`);
			return message.channel.send(`${message.author}, something went wrong. Please report this. ERROR_4: \`${err}\``);
		  });
		};
	
		function verifyTimezone(player) {
		  let tzExample = new Discord.MessageEmbed()
				.setColor('#7289DA')
				.setTitle('Quick Reference')
				.setFooter(`Executed at ${new Date().toLocaleDateString()} | ${new Date().toLocaleTimeString()} UTC`, 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/e/e9/Book_and_Quill_JE2_BE2.png/revision/latest/scale-to-width-down/160?cb=20190530235621')
				.setDescription(`Username verified. ${message.author}, please enter your UTC offset in this format: \`-/+0\` or \`-/+0:00\`, eg: \`-7\`, \`+12:45\`. You have two minutes, so take your time to find it.\n\n**+0** Greenwich Mean Time (GMT)\n**+1** Central European Time (CET)\n**+2** Eastern European Time (EET)\n**+3** Moscow Time (MSK)\n**+4** Armenia Time (AMT)\n**+5** Pakistan Standard Time (PKT)\n**+6** Omsk Time (OMSK)\n**+7** Kranoyask Time (KRAT)\n**+8** China Standard Time (CST)\n**+9** Japan Standard Time (JST)\n**+10** Eastern Australia Standard Time (AEST)\n**+11** Sakhalin Time (SAKT)\n**+12** New Zealand Standard Time (NZST)\n\n**-0** Greenwich Mean Time (GMT)\n**-1**	West Africa Time (WAT)\n**-2** Azores Time (AT)\n**-3**	Argentina Time (ART)\n**-4** Atlantic Standard Time (AST)\n**-5** Eastern Standard Time (EST)\n**-6** Central Standard Time (CST)\n**-7** Mountain Standard Time (MST)\n**-8** Pacific Standard Time (PST)\n**-9** Alaska Standard Time (AKST)\n**-10** Hawaii Standard Time (HST)\n**-11** Nome Time (NT)\n**-12** International Date Line West (IDLW)`)
				message.channel.send(tzExample)
		  message.channel.awaitMessages(m => m.author.id == message.author.id, {
			max: 1,
			time: 1200000
		  }).then(collected => {
			let timezone = collected.first().content.toLowerCase()
			if (!/^([+-](?:2[0-3]|1[0-9]|[0-9]|0[0-9])(:?[0-5]\d)?)$/g.test(timezone)) {
			  let formatExample = new Discord.MessageEmbed()
				.setColor('#FF5555')
				.setTitle('Invalid Format Or Offset!')
				.setFooter(`Executed at ${new Date().toLocaleDateString()} | ${new Date().toLocaleTimeString()} UTC`, 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/e/e9/Book_and_Quill_JE2_BE2.png/revision/latest/scale-to-width-down/160?cb=20190530235621')
				.setDescription(`That isn't valid! It must be between -23:59 and +23:59. Please use the format \`-/+0\` or \`-/+0:00\`\n\n**Examples:**`)
				.addField('-07:00', '7 hours behind UTC')
				.addField(`-7`, `7 hours behind UTC`)
				.addField('+05:45', '5 hours and 45 minutes ahead of UTC')
				.addField('+5:45', '5 hours and 45 minutes ahead of UTC');
			  return message.channel.send(formatExample).then(async msg => {
				setTimeout(() => {
				  msg.delete();
				}, 60000);
			  });
			}
	
			function UTCOffsetToDecimals(utc) {
				if (!utc.includes(":")) {
				  return `${utc * 1}`;
				} else if (utc.slice(0, 1) !== "+" && utc.slice(0, 1) !== "-") {
				  let minutesToDecimal = (utc.slice(-2) / 60);
				  let hours = utc.slice(0, -3) * 1;
				  let result = (hours + minutesToDecimal);
				  return result;
				}
				let minutesToDecimal = (utc.slice(-2) / 60);
				let hours = utc.slice(1, -3) * 1;
				let result = `${utc.slice(0, 1) == '+' ? `${hours + minutesToDecimal}` : `${utc.slice(0, 1) + (hours + minutesToDecimal)}`}`;
				return result;
			  };
	
			offlineTime1(player, UTCOffsetToDecimals(timezone))
	
		  }).catch((err) => {
			  console.log(`type error? ${err}`)
			if (err instanceof TypeError) return message.channel.send(`${message.author}, you did not send a UTC offset. Setup canceled.`).then(async msg => {
			  setTimeout(() => {
				msg.delete();
			  }, 30000);
			});
			console.log(`ERROR_5: ${err}`);
			return message.channel.send(`${message.author}, something went wrong. Please report this. ERROR_5: \`${err}\``);
		  });
		};
	
		function offlineTime1(player, timezone) {
		  message.channel.send(`Timezone verified. ${message.author}, please enter when you usually **get off** Hypixel in the 24 hour format, eg: \`23:45\`, \`00:30\`. Logins after this time will be alerts, so you may want to add an hour or two.`)
		  message.channel.awaitMessages(m => m.author.id == message.author.id, {
			max: 1,
			time: 60000
		  }).then(collected => {
			let offlineLogout = collected.first().content.toLowerCase()
			if (!/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/g.test(offlineLogout)) {
			  let formatExample = new Discord.MessageEmbed()
				.setColor('#FF5555')
				.setTitle('Invalid Format Or Numbers!')
				.setFooter(`Executed at ${new Date().toLocaleDateString()} | ${new Date().toLocaleTimeString()} UTC`, 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/e/e9/Book_and_Quill_JE2_BE2.png/revision/latest/scale-to-width-down/160?cb=20190530235621')
				.setDescription(`That isn't valid! It must be between 0:00 and 23:59. 0:00 is 12:00 am. Please use the format \`-/+00:00\` and enter it in your timezone\n\n**Examples:**`)
				.addField('23:00', 'Alerts occur if a login is detected after 11 pm')
				.addField('3:00', 'Alerts occur if a login is detected after 3:00 am')
			  return message.channel.send(formatExample).then(async msg => {
				setTimeout(() => {
				  msg.delete();
				}, 60000);
			  });
			}
	
			offlineTime2(player, timezone, TimeToDecimals(offlineLogout), offlineLogout)
	
		  }).catch((err) => {
			if (err instanceof TypeError) return message.channel.send(`${message.author}, you did not send a logout time. Setup canceled.`).then(async msg => {
			  setTimeout(() => {
				msg.delete();
			  }, 30000);
			});
			console.log(`ERROR_6: ${err}`);
			return message.channel.send(`${message.author}, something went wrong. Please report this. ERROR_6: \`${err}\``);
		  });
		};
	
		function offlineTime2(player, timezone, logoutDecimal, offlineLogout) {
		  message.channel.send(`Logout time verified. ${message.author}, please enter when you usually **get on** Hypixel in the 24 hour format, eg: \`9:15\`, \`11:00\`. Logins after this time won't be alerts.`)
		  message.channel.awaitMessages(m => m.author.id == message.author.id, {
			max: 1,
			time: 60000
		  }).then(collected => {
			let offlineLogin = collected.first().content.toLowerCase()
			if (!/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/g.test(offlineLogin)) {
			  let formatExample = new Discord.MessageEmbed()
				.setColor('#FF5555')
				.setTitle('Invalid Format Or Numbers!')
				.setFooter(`Executed at ${new Date().toLocaleDateString()} | ${new Date().toLocaleTimeString()} UTC`, 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/e/e9/Book_and_Quill_JE2_BE2.png/revision/latest/scale-to-width-down/160?cb=20190530235621')
				.setDescription(`That isn't valid! It must be between 0:00 and 23:59. 0:00 is 12 am. Please use the format \`-/+00:00\` and enter it in your timezone\n\n**Examples:**`)
				.addField('23:00', 'Alerts occur if a login is detected after 11 pm')
				.addField('3:00', 'Alerts occur if a login is detected after 3:00 am')
			  return message.channel.send(formatExample).then(async msg => {
				setTimeout(() => {
				  msg.delete();
				}, 60000);
			  });
			}
	
	
			let loginDecimal = TimeToDecimals(offlineLogin);
			let offlineTime = logoutDecimal + " " + loginDecimal;
	
			createChannel(player, timezone, offlineTime, offlineLogout, offlineLogin);
	
		  }).catch((err) => {
			if (err instanceof TypeError) return message.channel.send(`${message.author}, you did not send a login time. Setup canceled.`).then(async msg => {
			  setTimeout(() => {
				msg.delete();
			  }, 60000);
			});
			console.log(`ERROR_7: ${err}`);
			return message.channel.send(`${message.author}, something went wrong. Please report this. ERROR_7: \`${err}\``);
		  });
		};

		async function createChannel(player, timezone, offlineTime, offlineLogout, offlineLogin) {
			try {

			let logChannel = await message.guild.channels.create(`${message.author.tag}-log`, {type: 'text'})
            let alertChannel = await message.guild.channels.create(`${message.author.tag}-alerts`, {type: 'text'})
			
			if (!message.guild.channels.cache.find(c => c.name == "log" && c.type == "category")) {
				await message.guild.channels.create("log", {type: 'category'});
				const category = message.guild.channels.cache.find(c => c.name == "log" && c.type == "category");
				logChannel.setParent(category.id);
                alertChannel.setParent(category.id);
			} else {
				const category = message.guild.channels.cache.find(c => c.name == "log" && c.type == "category");
				logChannel.setParent(category.id);
                alertChannel.setParent(category.id);
			}

    

                logChannel.overwritePermissions([
                    {
                        id: message.guild.id,
                        deny: ['VIEW_CHANNEL'],
                    },
                    {
                        id: message.author.id,
                        allow: ['VIEW_CHANNEL'],
						deny: ['SEND_MESSAGES'],
                    },
					{
                        id: message.client.user.id,
                        allow: ['VIEW_CHANNEL','SEND_MESSAGES','MANAGE_MESSAGES','MANAGE_CHANNELS'],
                    },
                ]);
                alertChannel.overwritePermissions([
                    {
                        id: message.guild.id,
                        deny: ['VIEW_CHANNEL'],
                    },
                    {
                        id: message.author.id,
                        allow: ['VIEW_CHANNEL'],
						deny: ['SEND_MESSAGES'],
                    },
					{
                        id: message.client.user.id,
                        allow: ['VIEW_CHANNEL','SEND_MESSAGES','MANAGE_MESSAGES','MANAGE_CHANNELS'],
                    },
                ]);
    
                client.channels.cache.get(alertChannel.id).send(`${message.author}, your alert messages will be sent here. You should keep notifications **on** for this channel. The command \`${prefix}alert <blacklist, whitelist, language, session, offline, or version\` can individually toggle the 6 alert types, should you need to turn any of them off. By default, blacklist & whitelist alerts are off as you have not added anything to them yet.`).then((msg) => msg.pin());
                client.channels.cache.get(logChannel.id).send(`${message.author}, your log messages will be sent here. You should turn notifications **off** for this channel and mute this channel. Now, execute the command \`${prefix}monitor\` to start the logging and monitoring. Additionally, \`${prefix}monitor\` can turn the logging and monitoring on or off at your convenience.`).then((msg) => msg.pin());
			
			writeData(player, timezone, offlineTime, offlineLogout, offlineLogin, logChannel.id, alertChannel.id)

			} catch (err) {
				if (err.name == `MissingCategory`) {
					console.log(`ERROR_15: ${err}`);
					return message.channel.send(`${message.author}, something went wrong. Please report this. ERROR_15: \`${err}\``);
				  }
				console.log(`ERROR_16: ${err}`);
				message.channel.send(`${message.author}, something went wrong. Please report this. ERROR_16 \`${err}\``)
			}
		};
	
		function writeData(player, timezone, offlineTime, offlineLogout, offlineLogin, logID, alertID) {
		  let uuid = player[0].uuid,
			language = player[0].language,
			version = player[0].mc_version
		  login = player[0].last_login,
			logout = player[0].last_logout;
	
		  try {
			let db = new sqlite.Database('./database.db', sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE);

			db.serialize(() => {
	
				let insertdata = db.prepare(`INSERT INTO data VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
				insertdata.run(message.author.id, message.author.tag, uuid, language, version, offlineTime, "", "", login, logout, timezone, "0 0 1 1 1 1", message.guild.id, logID, alertID, "0", "", "");
				insertdata.finalize();
				db.close();
			  });

			let setupData = new Discord.MessageEmbed()
			  .setColor('#00AA00')
			  .setTitle(`Success!`)
			  .setDescription(`You can change most of these at anytime. Check ${prefix}help to see what's available. Now, execute the command \`${prefix}log\` to start the logging. Additionally, \`${prefix}log\` can turn the logging on or off at your convenience.`)
			  .setFooter(`Executed at ${new Date().toLocaleDateString()} | ${new Date().toLocaleTimeString()} UTC`, 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/e/e9/Book_and_Quill_JE2_BE2.png/revision/latest/scale-to-width-down/160?cb=20190530235621');
			setupData.addFields({
			  name: 'Discord ID',
			  value: `${message.author.id}`
			}, {
			  name: 'Discord Tag',
			  value: `${message.author.tag}`
			}, {
			  name: 'UUID',
			  value: `${uuid}`
			}, {
			  name: 'Language',
			  value: `${language}`
			}, {
			  name: 'Version',
			  value: `${version}`
			}, {
			  name: 'Offline Time',
			  value: `${twentyFourToTwelve(offlineLogout)} to ${twentyFourToTwelve(offlineLogin)}`
			}, {
			  name: 'UTC Offset',
			  value: `UTC ${timezone}`
			}, {
			  name: 'Log Channel',
			  value: `<#${logID}>`
			}, {
			  name: 'Alert Channel',
			  value: `<#${alertID}>`
			},)
			if (player[0].online == true && player[1].online == false) setupData.addField('**Limited API!**', 'Your Online API option on Hypixel was detected to being off. Please turn it on.', true)
			return message.reply(setupData);
		  } catch (err) {
			console.log(`ERROR_3: ${err}`);
			message.channel.send(`An error occured while writing data. Please report this. ERROR_3: \`${err}\``);
		  }
		};

		function twentyFourToTwelve(time) {
			var time = time.toString().match(/^([01]?\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];
			if (time.length > 1) {
			  time = time.slice(1);
			  time[5] = +time[0] < 12 ? ' AM' : ' PM';
			  time[0] = +time[0] % 12 || 12;
			}
			return time.join('');
		  };

		function TimeToDecimals(time) {
			let minutesToDecimal = (time.slice(-2) / 60);
			let hourToDecimal = time.slice(0, -3) * 1;
			let result = (hourToDecimal + minutesToDecimal);
			return result;
			};
	},
};