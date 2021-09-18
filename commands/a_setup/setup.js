const { MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu, Permissions } = require('discord.js');
const funcImports = require('../../functions.js');
const database = require('../../database.js');
const events = require('../../events');
const fetch = require('node-fetch');
const controller = new AbortController();
const fetchTimeout = (url, ms, { signal, ...options } = {}) => {
    const promise = fetch(url, { signal: controller.signal, ...options });
    if (signal) signal.addEventListener("abort", () => controller.abort());
    const timeout = setTimeout(() => controller.abort(), ms);
    return promise.finally(() => clearTimeout(timeout));
};
module.exports = {
  	name: 'setup',
  	title: 'Allows players to begin using HyGuard',
	description: 'Allows players to begin using HyGuard. This command has about 5 steps and will create channels once completed.',
  	usage: `\`/setup [UUID or username]\``,
  	database: false,
  	guildOnly: true,
  	ownerReq: false,
  	cooldown: 7.5,
    commandPermissions: [],
  	botChannelPermissions: ["VIEW_CHANNEL","READ_MESSAGE_HISTORY"], //May not need read message history
  	botGuildPermissions: ["MANAGE_CHANNELS","MANAGE_MESSAGES","MANAGE_ROLES"],
	async execute(interaction, client, row) {
    let readData = funcImports.readOwnerSettings();
    let api = readData.api,
        userLimit = readData.userLimit,
        blockedUsers = readData.blockedUsers,
        dst = readData.dst;

    let tzOffset = row ? (dst == true && row.daylightSavings == true ? row.timezone * 1 + 1: row.timezone) * 3600000 : 0;
    let tz = row ? (dst == true && row.daylightSavings == true == true ? row.timezone * 1 + 1: row.timezone) : 0;
    let timeString = row ? `${new Date(Date.now() + tzOffset).toLocaleTimeString('en-IN', { hour12: true })} UTC${funcImports.decimalsToUTC(tz)}` : `${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0`;

    let setupEmbed = new MessageEmbed()
        .setTimestamp()
        .setFooter(`${interaction.id} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');
    let noResponseEmbed = new MessageEmbed()
        .setTimestamp()
        .setColor('#FF5555')
        .setTitle(`No Response!`)
        .setDescription('Setup has been canceled as you did not respond.')
        .setFooter(`${interaction.id} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');
    if (row) {
        setupEmbed.setColor(`#FF5555`);
        setupEmbed.setTitle(`Command Used Already!`);
        setupEmbed.setDescription(`You already used this command! You cannot use this command again unless you delete all your data first.`);
        return interaction.reply({ embeds: [setupEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
    }

    let assets = funcImports.readAssets();

    checkSystemLimits();

	async function checkSystemLimits() { //Basic system checks
        let player = interaction.options.getString('player');
		try {
			if (blockedUsers.includes(interaction.user.id)) {
				setupEmbed.setColor(`#FF5555`);
                setupEmbed.setTitle(`Access Denied!`);
                setupEmbed.setDescription(`You are blocked from using this system.`);
                console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: User Is Blocked`);
                return await interaction.reply({ embeds: [setupEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
			}
			let checkUserLimit = await database.getUserCount()
			if (checkUserLimit['count(1)'] >= userLimit) {
                setupEmbed.setColor(`#FF5555`);
                setupEmbed.setTitle(`Max Users Reached!`);
                setupEmbed.setDescription(`The max amount of users was reached. Please check back later!`);
                console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: User Max Reached`);
                return await interaction.reply({ embeds: [setupEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
            }
			if (api == false) {
                setupEmbed.setColor(`#FF5555`);
                setupEmbed.setTitle(`API is down!`);
                setupEmbed.setDescription(`This command was disabled temporarily as the Hypixel API is down!`);
                console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: API Is False`);
                return await interaction.reply({ embeds: [setupEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
            }
            if (!/^[a-zA-Z0-9_-]{1,24}$/g.test(player) && !/^[0-9a-f]{8}(-?)[0-9a-f]{4}(-?)[1-5][0-9a-f]{3}(-?)[89AB][0-9a-f]{3}(-?)[0-9a-f]{12}$/i.test(player)) {
                setupEmbed.setColor(`#FF5555`);
                setupEmbed.setTitle(`Invalid Username or UUID!`);
                setupEmbed.setDescription(`The username/UUID provided is invalid! The username cannot contain invalid characters. UUIDs must match the following regex: \`/^[0-9a-f]{8}[0-9a-f]{4}[1-5][0-9a-f]{3}[89AB][0-9a-f]{3}[0-9a-f]{12}$/i\`. You can test this regex with [__this__](https://regex101.com/r/A866mm/1) site.`);
                console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Invalid Player Name/UUID`);
                return await interaction.reply({ embeds: [setupEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
            }
            await interaction.deferReply(); //In case the API requests below take more than the 3 seconds the interaction gets
            if (/^[0-9a-f]{8}(-?)[0-9a-f]{4}(-?)[1-5][0-9a-f]{3}(-?)[89AB][0-9a-f]{3}(-?)[0-9a-f]{12}$/i.test(player)) return requestPlayer(player);
            requestUUID(player);	
		} catch (err) {
			events.errorMsg(interaction, err)
		}
	};

    async function requestUUID(username, undefinedIfHasntAborted) {
        Promise.all([
            fetchTimeout(`https://api.mojang.com/users/profiles/minecraft/${username}`, 5000, {
                signal: controller.signal
            })
            .then(function(response) {
              if (response.status === 204) {let newError = new Error("HTTP status " + response.status); newError.name = "NotFound"; throw newError;}
              if (!response.ok) {throw new Error("HTTP status " + response.status);}
              return response.json();
            })
          ])
            .then((response) => {
                requestPlayer(response[0].id);
            })
            .catch(async (err) => {
                if (err.name === "AbortError") {
                    if (undefinedIfHasntAborted === undefined) {
                        statusEmbed.setColor('#FF5555');
                        statusEmbed.setTitle(`Connection Failed!`);
                        statusEmbed.setDescription('The Mojang API failed to respond, trying again..');
                        await interaction.editReply({ embeds: [statusEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                        return requestUUID(username, true); //Simple way to try again without an infinite loop
                    }
                    setupEmbed.setColor('#AA0000');
                    setupEmbed.setTitle(`Abort Error!`);
                    setupEmbed.setDescription('The Mojang API failed to respond, and may be down. Try again later.');
                    console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Mojang Abort Error`);
                    return await interaction.editReply({ embeds: [setupEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                } else if (err.name === "NotFound") {
                    setupEmbed.setColor(`#FF5555`); setupEmbed.setTitle(`Player Not Found!`);
                    setupEmbed.setDescription(`Your Minecraft username doesn\'t seem to exist or hasn\'t logged onto Hypixel.`);
                    console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Mojang Player Not Found`);
                    return await interaction.editReply({ embeds: [setupEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                } else {
                    return events.errorMsg(interaction, err);
                }
            });
    };

    function requestPlayer(uuid, undefinedIfHasntAborted) { //Requests the player data from Slothpixel
        Promise.all([
            fetchTimeout(`https://api.slothpixel.me/api/players/${uuid}/`, 2000, {
                signal: controller.signal
              }).then(function(response) {
                if (response.status === 404) {let newError = new Error("HTTP status " + response.status); newError.name = "NotFound"; throw newError;}
                if (!response.ok) {let newError = new Error("HTTP status " + response.status); newError.name = "HTTPError"; throw newError;}
                return response.json();
              }),
            fetchTimeout(`https://api.slothpixel.me/api/players/${uuid}/status/`, 2000, {
                signal: controller.signal
              }).then(function(response) {
                if (response.status === 404) {let newError = new Error("HTTP status " + response.status); newError.name = "NotFound"; throw newError;}
                if (!response.ok) {let newError = new Error("HTTP status " + response.status); newError.name = "HTTPError"; throw newError;}
                return response.json();
              })
          ])
          .then((player) => {
            let discordTag = `${interaction.user.username}#${interaction.user.discriminator}`
            if (!player[0].links.DISCORD) {
                setupEmbed.setColor('#FF5555');
                setupEmbed.setTitle(`Link your Discord on Hypixel!`);
                setupEmbed.setDescription('You have not linked your Discord account to your Minecraft account on Hypixel! Follow the guide below:');
                setupEmbed.setImage('https://i.imgur.com/gGKd2s8.gif');
                console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Discord Not Linked`);
                return interaction.editReply({ embeds: [setupEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
            }
            if (player[0].links.DISCORD !== discordTag) {
                setupEmbed.setColor('#FF5555');
                setupEmbed.setTitle(`That isn't your account!`);
                setupEmbed.setDescription('That Minecraft account currently has a different Discord account linked! If that is your account, follow the guide below to relink it: ');
                setupEmbed.setImage('https://i.imgur.com/gGKd2s8.gif');
                console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Discord tag doesn't match`);
                return interaction.editReply({ embeds: [setupEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
            }
            introduction(player);
          })
          .catch(async (err) => {
            if (err.name === "AbortError") {
                if (undefinedIfHasntAborted === undefined) {
                    statusEmbed.setColor('#FF5555');
                    statusEmbed.setTitle(`Connection Failed!`);
                    statusEmbed.setDescription('The Slothpixel API failed to respond, trying again..');
                    await interaction.editReply({ embeds: [statusEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                    return requestPlayer(uuid, true); //Simple way to try again without an infinite loop
                }
                setupEmbed.setColor('#AA0000');
                setupEmbed.setTitle(`Abort Error!`);
                setupEmbed.setDescription('The API failed to respond, and may be down. Try again later.');
                console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Slothpixel Abort Error`);
                return await interaction.editReply({ embeds: [setupEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
            } else if (err.name === "NotFound") {
                setupEmbed.setColor(`#FF5555`); setupEmbed.setTitle(`Player Not Found!`);
                setupEmbed.setDescription(`Your Minecraft username doesn\'t seem to exist or hasn\'t logged onto Hypixel. Setup canceled.`);
                console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Slothpixel Player Not Found`);
                return await interaction.editReply({ embeds: [setupEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
            } else {
                return events.errorMsg(interaction, err);
            }
          });
    }

    async function introduction(playerData) { //More friendly, less overwhelming
        setupEmbed.setColor('#7289DA');
        setupEmbed.setTitle(`Setup!`);
        setupEmbed.setDescription(`Welcome! There are about 5 steps to complete. This process has been redesigned with new features like select menus and buttons to be more friendly. To begin, press Ok!`);
        let introButton = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setCustomId('true')
					.setLabel('Ok')
					.setStyle('PRIMARY'),
			);
        let introButtonMsg = await interaction.editReply({ embeds: [setupEmbed], components: [introButton] }).catch((err) => {return events.errorMsg(interaction, err)});
        let filter = i => {
            i.deferUpdate();
            return i.user.id === interaction.user.id;
        };
        let updatedIntroButton = new MessageActionRow()
			.addComponents(
				new MessageButton()
				    .setCustomId('true')
					    .setLabel('Ok')
					    .setStyle('PRIMARY')
                        .setDisabled(true),
			);
        introButtonMsg.awaitMessageComponent({ filter, componentType: 'BUTTON', time: 60000 })
	        .then(async i => {
                await interaction.editReply({ embeds: [setupEmbed], components: [updatedIntroButton] }).catch((err) => {return events.errorMsg(interaction, err)});
                return verifyTimezone(playerData);
            })
	        .catch(async (err) => {
                if (err.name === 'Error [INTERACTION_COLLECTOR_ERROR]') {
                    await interaction.followUp({ embeds: [noResponseEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                    console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Collecter Step Failed`);
                    return await interaction.editReply({ embeds: [setupEmbed], components: [updatedIntroButton] }).catch((err) => {return events.errorMsg(interaction, err)});
                } else return events.errorMsg(interaction, err);
            });
    }

    async function verifyTimezone(playerData) {
        let setupTZ = assets.setupTZ;
        let tzMenu = new MessageActionRow()
			.addComponents(
				new MessageSelectMenu()
					.setCustomId('tzselect')
					.setPlaceholder('Select a Timezone')
					.addOptions(setupTZ),
			);
            setupEmbed.setColor('#7289DA');
            setupEmbed.setTitle(`Timezone!`);
            setupEmbed.setDescription('Please select your timezone in the drop down below or select \`Other\` if your timezone is not listed.');
        let tzSelectMenu = await interaction.followUp({ embeds: [setupEmbed], components: [tzMenu] }).catch((err) => {return events.errorMsg(interaction, err)});

        let tzMenuFilter = i => {
            i.deferUpdate();
            return i.user.id === interaction.user.id && i.customId === 'tzselect';
        };

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
        
        tzSelectMenu.awaitMessageComponent({ filter: tzMenuFilter, componentType: 'SELECT_MENU', time: 300000 })
            .then(async selectInteraction => {
                if (selectInteraction.values[0] !== 'custom') { //Ignores the section below if they didn't select custom
                    await tzSelectMenu.delete();
                    return daylightSavings(playerData, selectInteraction.values[0] * 1);
                }
                setupEmbed.setColor('#7289DA');
                setupEmbed.setTitle(`Custom UTC Offset!`);
                setupEmbed.setDescription('Please type your UTC offset in the format \`-/+0\` or \`-/+0:00\`, eg: \`-7\`, \`+12:45\`. You have 5 minutes, so please take your time. You have 5 chances before setup automatically cancels. List of common UTC Offsets & their locations: [link](https://en.wikipedia.org/wiki/List_of_UTC_time_offsets)');
                await tzSelectMenu.delete()
                await interaction.followUp({ embeds: [setupEmbed], fetchReply: true }).catch((err) => {return events.errorMsg(interaction, err)})
	                .then((customTZMsg) => {
                        let tzMsgFilter = m => m.author.id === interaction.user.id;
		                let collector = interaction.channel.createMessageCollector({ filter: tzMsgFilter, max: 5, time: 300000 })
                        let responses = []
                            collector.on('collect', async collected => {
                                responses.push(collected.content.toLowerCase())
                                if (!/^([+-](?:2[0-3]|1[0-9]|[0-9]|0[0-9])(:?[0-5]\d)?)$/g.test(collected.content.toLowerCase()) && responses.length < 5) {
                                    setupEmbed.setColor('#FF5555');
                                    setupEmbed.setTitle(`Invalid Format!`);
                                    setupEmbed.setDescription(`Please try again. You have ${5 - responses.length} chances left. Enter your UTC offset in the format \`-/+0\` or \`-/+0:00\`, eg: \`-7\`, \`+12:45\`. You have 5 minutes, so please take your time. You have 5 total chances before setup automatically cancels. List of UTC Offsets: [link](https://en.wikipedia.org/wiki/List_of_UTC_time_offsets)`);
                                    await interaction.followUp({ embeds: [setupEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                                } else {
                                    collector.stop()
                                }
                            })
                            collector.on('end', async collected => {
                                customTZMsg.delete().catch((err) => {return events.errorMsg(interaction, err)});
                                if (responses.length === 0) return await interaction.followUp({ embeds: [noResponseEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                                if (/^([+-](?:2[0-3]|1[0-9]|[0-9]|0[0-9])(:?[0-5]\d)?)$/g.test(collected.last().content.toLowerCase())) {
                                    return daylightSavings(playerData, UTCOffsetToDecimals(collected.last().content.toLowerCase()));
                                }
                                setupEmbed.setColor('#FF5555');
                                setupEmbed.setTitle(`Invalid Format!`);
                                setupEmbed.setDescription('Setup has been canceled as you either did not provide an offset.');
                                console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Collector Step Failed`);
				                return await interaction.followUp({ embeds: [setupEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                            });
	                });
            })
            .catch(async (err) => {
                if (err.name === 'Error [INTERACTION_COLLECTOR_ERROR]') {
                    let updatedtzSelectMenu = new MessageActionRow()
			            .addComponents(
				            new MessageSelectMenu()
					            .setCustomId('updatedtzSelectMenu')
					            .setPlaceholder('Select a Timezone')
                                .setDisabled(true)
                                .addOptions([{label: 'wtf', description: 'lmao hi', value: 'notavalue'}]),
			            );
                    console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Collector Step Failed`);
                    await interaction.followUp({ embeds: [noResponseEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                    return await tzSelectMenu.edit({ embeds: [setupEmbed], components: [updatedtzSelectMenu] }).catch((err) => {return events.errorMsg(interaction, err)});
                } else return events.errorMsg(interaction, err);
            });
    }
    
    async function daylightSavings(playerData, timezone) {
        setupEmbed.setColor('#7289DA');
        setupEmbed.setTitle(`Daylight Savings!`);
        setupEmbed.setDescription(`Timezone has been verified. Do you use DST (Daylight Saving Time)?${dst === true ? ` If you do, your current time and date should be ${new Date(Date.now() + (timezone * 1 + 1) * 3600000).toLocaleTimeString('en-IN', { hour12: true })}, ${funcImports.epochToCleanDate(new Date(Date.now() + (timezone * 1 + 1) * 3600000))}.` : ``}`);
        let dstButton = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setCustomId('true')
					.setLabel('Yes')
					.setStyle('SUCCESS'),
                new MessageButton()
					.setCustomId('false')
					.setLabel('No')
					.setStyle('DANGER'),
			);
        let dstButtonMsg = await interaction.followUp({ embeds: [setupEmbed], components: [dstButton] }).catch((err) => {return events.errorMsg(interaction, err)});

        let dstFilter = i => {
            i.deferUpdate();
            return i.user.id === interaction.user.id && (i.customId === 'true' || i.customId === 'false');
        };

        dstButtonMsg.awaitMessageComponent({ filter: dstFilter, componentType: 'BUTTON', time: 120000 })
	        .then(async i => {
                await dstButtonMsg.delete();
                if (i.customId === 'true') return logoutTime(playerData, timezone, true);
                else return logoutTime(playerData, timezone, false);
            })
	        .catch(async err => {
                if (err.name === 'Error [INTERACTION_COLLECTOR_ERROR]') {
                    let updatedDSTButton = new MessageActionRow() //Sets the buttons to disabled to shwo that you cant interact anymore
			        .addComponents(
				        new MessageButton()
					        .setCustomId('true')
					        .setLabel('Yes')
					        .setStyle('SUCCESS')
                            .setDisabled(true),
                        new MessageButton()
					        .setCustomId('false')
					        .setLabel('No')
					        .setStyle('DANGER')
                            .setDisabled(true),
			        );
                    console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Collected Failed Step`);
                    await interaction.followUp({ embeds: [noResponseEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                    return await dstButtonMsg.edit({ embeds: [setupEmbed], components: [updatedDSTButton] }).catch((err) => {return events.errorMsg(interaction, err)});
                } else return events.errorMsg(interaction, err);
            });
    }

    async function logoutTime(playerData, timezone, dstBoolean) {
        let setupLogout = assets.setupLogout
        let logoutMenu = new MessageActionRow()
			.addComponents(
				new MessageSelectMenu()
					.setCustomId('logoutselect')
					.setPlaceholder('Select a Logout Time')
					.addOptions(setupLogout),
			);
            setupEmbed.setColor('#7289DA');
            setupEmbed.setTitle(`Logout Time!`);
            setupEmbed.setDescription('Please select when you usually **get off** Hypixel in the drop down below or select \`Advanced\` if you want to select minutes as well. Logins after this time will send an alert, so you may want to add an hour or two.');
        let logoutSelectMenu = await interaction.followUp({ embeds: [setupEmbed], components: [logoutMenu] }).catch((err) => {return events.errorMsg(interaction, err)});

        function TimeToDecimals(time) {
			let minutesToDecimal = (time.slice(-2) / 60);
			let hourToDecimal = time.slice(0, -3) * 1;
			let result = (hourToDecimal + minutesToDecimal);
			return result;
		};

        let logoutMenuFilter = i => {
            i.deferUpdate();
            return i.user.id === interaction.user.id && i.customId === 'logoutselect';
        };
        
        logoutSelectMenu.awaitMessageComponent({ filter: logoutMenuFilter, componentType: 'SELECT_MENU', time: 300000 })
            .then(async selectInteraction => {
                if (selectInteraction.values[0] !== 'custom') {
                    await logoutSelectMenu.delete().catch((err) => {return events.errorMsg(interaction, err)});
                    return loginTime(playerData, timezone, dstBoolean, selectInteraction.values[0] * 1);
                }
                setupEmbed.setColor('#7289DA');
                setupEmbed.setTitle(`Custom Logout Time!`);
                setupEmbed.setDescription('Please type when you usually **get off** of Hypixel in the 24 hour format, eg: \`23:45\`, \`00:30\`. You have 5 chances before setup automatically cancels. Logins after this time will send an alert.');
                await logoutSelectMenu.delete().catch((err) => {return events.errorMsg(interaction, err)});
                await interaction.followUp({ embeds: [setupEmbed], fetchReply: true }).catch((err) => {return events.errorMsg(interaction, err)})
	                .then((customLogoutMsg) => {
                        let logoutMsgFilter = m => m.author.id === interaction.user.id;
		                let collector = interaction.channel.createMessageCollector({ filter: logoutMsgFilter, max: 5, time: 300000 })
                        let responses = []
                            collector.on('collect', async collected => {
                                responses.push(collected.content.toLowerCase())
                                if (!/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/g.test(collected.content.toLowerCase()) && responses.length < 5) {
                                    setupEmbed.setColor('#FF5555');
                                    setupEmbed.setTitle(`Invalid Format!`);
                                    setupEmbed.setDescription(`Please try again. You have ${5 - responses.length} chances left. Enter your login time in the 24 hour format, eg: \`23:45\`, \`00:30\`.`);
                                    await interaction.followUp({ embeds: [setupEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                                } else {
                                    collector.stop()
                                }
                            })
                            collector.on('end', async collected => {
                                customLogoutMsg.delete().catch((err) => {return events.errorMsg(interaction, err)});
                                if (responses.length === 0) return await interaction.followUp({ embeds: [noResponseEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                                if (/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/g.test(collected.last().content.toLowerCase())) {
                                    return loginTime(playerData, timezone, dstBoolean, TimeToDecimals(collected.last().content.toLowerCase()));
                                }
                                setupEmbed.setColor('#FF5555');
                                setupEmbed.setTitle(`Invalid Format!`);
                                setupEmbed.setDescription('Setup has been canceled as you either did not provide a logout time.');
                                console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Collector Failed Step`);
				                return await interaction.followUp({ embeds: [setupEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                            });
	                });
            })
            .catch(async (err) => {
                if (err.name === 'Error [INTERACTION_COLLECTOR_ERROR]') {
                    let updatedLogoutSelectMenu = new MessageActionRow()
			            .addComponents(
				            new MessageSelectMenu()
					            .setCustomId('updatedLogoutSelectMenu')
					            .setPlaceholder('Select a Logout Time')
                                .setDisabled(true)
                                .addOptions([{label: 'wtf', description: 'lmao hi', value: 'notavalue'}]),
			            );
                    console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Collector Failed Step`);
                    await interaction.followUp({ embeds: [noResponseEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                    return await logoutSelectMenu.edit({ embeds: [setupEmbed], components: [updatedLogoutSelectMenu] }).catch((err) => {return events.errorMsg(interaction, err)});
                } else return events.errorMsg(interaction, err);
            });
    }

    async function loginTime(playerData, timezone, dstBoolean, playerLogoutTime) {
        let setupLogin = assets.setupLogin
        let loginMenu = new MessageActionRow()
			.addComponents(
				new MessageSelectMenu()
					.setCustomId('loginselect')
					.setPlaceholder('Select a Login Time')
					.addOptions(setupLogin),
			);
            setupEmbed.setColor('#7289DA');
            setupEmbed.setTitle(`Login Time!`);
            setupEmbed.setDescription('Please select when you usually **get on** Hypixel in the drop down below or select \`Advanced\` if you want to select minutes as well. Logins after this time **will not** send an alert.');
        let loginSelectMenu = await interaction.followUp({ embeds: [setupEmbed], components: [loginMenu] }).catch((err) => {return events.errorMsg(interaction, err)});

        function TimeToDecimals(time) {
			let minutesToDecimal = (time.slice(-2) / 60);
			let hourToDecimal = time.slice(0, -3) * 1;
			let result = (hourToDecimal + minutesToDecimal);
			return result;
		};

        let loginMenuFilter = i => {
            i.deferUpdate();
            return i.user.id === interaction.user.id && i.customId === 'loginselect';
        };

        loginSelectMenu.awaitMessageComponent({ filter: loginMenuFilter, componentType: 'SELECT_MENU', time: 300000 })
            .then(async selectInteraction => {
                if (selectInteraction.values[0] !== 'custom') {
                    await loginSelectMenu.delete().catch((err) => {return events.errorMsg(interaction, err)});
                    return createChannel(playerData, timezone, dstBoolean, playerLogoutTime, selectInteraction.values[0] * 1);
                }
                setupEmbed.setColor('#7289DA');
                setupEmbed.setTitle(`Custom Login Time!`);
                setupEmbed.setDescription('Please type when you usually **get on** of Hypixel in the 24 hour format, eg: \`9:15\`, \`11:00\`. You have 5 chances before setup automatically cancels. Logins after this time won\'t be alerts.');
                await loginSelectMenu.delete().catch((err) => {return events.errorMsg(interaction, err)});
                interaction.followUp({ embeds: [setupEmbed], fetchReply: true }).catch((err) => {return events.errorMsg(interaction, err)})
	                .then((customLoginMsg) => {
                        let loginMsgFilter = m => m.author.id === interaction.user.id;
		                let collector = interaction.channel.createMessageCollector({ filter: loginMsgFilter, max: 5, time: 300000 })
                        let responses = []
                            collector.on('collect', async collected => {
                                responses.push(collected.content.toLowerCase())
                                if (!/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/g.test(collected.content.toLowerCase()) && responses.length < 5) {
                                    setupEmbed.setColor('#FF5555');
                                    setupEmbed.setTitle(`Invalid Format!`);
                                    setupEmbed.setDescription(`Please try again. You have ${5 - responses.length} chances left. Enter your login time in the 24 hour format, eg: \`23:45\`, \`00:30\`.`);
                                    await interaction.followUp({ embeds: [setupEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                                } else {
                                    collector.stop()
                                }
                            })
                            collector.on('end', async collected => {
                                customLoginMsg.delete().catch((err) => {return events.errorMsg(interaction, err)});
                                if (responses.length === 0) return await interaction.followUp({ embeds: [noResponseEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                                if (/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/g.test(collected.last().content.toLowerCase())) {
                                    return createChannel(playerData, timezone, dstBoolean, playerLogoutTime, TimeToDecimals(collected.last().content.toLowerCase()));
                                }
                                setupEmbed.setColor('#FF5555');
                                setupEmbed.setTitle(`Invalid Format!`);
                                setupEmbed.setDescription('Setup has been canceled as you either did not provide a login time.');
                                console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Collector Failed Step`);
				                return await interaction.followUp({ embeds: [setupEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                            });
	                });
            })
            .catch(async (err) => {
                if (err.name === 'Error [INTERACTION_COLLECTOR_ERROR]') {
                    let updatedLoginSelectMenu = new MessageActionRow()
			            .addComponents(
				            new MessageSelectMenu()
					            .setCustomId('updatedLoginSelectMenu')
					            .setPlaceholder('Select a Login Time')
                                .setDisabled(true)
                                .addOptions([{label: 'wtf', description: 'lmao hi', value: 'notavalue'}]),
			            );
                    console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Collector Failed Step`);
                    await interaction.followUp({ embeds: [noResponseEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                    return await loginSelectMenu.edit({ embeds: [setupEmbed], components: [updatedLoginSelectMenu] }).catch((err) => {return events.errorMsg(interaction, err)});
                } else return events.errorMsg(interaction, err)
            });
    }

    async function createChannel(playerData, timezone, dstBoolean, playerLogoutTime, playerLoginTime) {
        let findCategory = await interaction.guild.channels.cache.find(c => c.name == "log" && c.type == "GUILD_CATEGORY");
        if (!findCategory) await interaction.guild.channels.create("log", {type: 'GUILD_CATEGORY'}).catch((err) => {return events.errorMsg(interaction, err)});
        let category = findCategory ? findCategory : await interaction.guild.channels.cache.find(c => c.name == "log" && c.type == "GUILD_CATEGORY");

        //Creates two channels, one for the log, one for the guild
        let logChannel = await interaction.guild.channels.create(`${interaction.user.username}#${interaction.user.discriminator}-log`, {
            type: 'GUILD_TEXT',
            parent: category,
            permissionOverwrites: [ //Overwrites the advanced permissios
                {
                    id: interaction.guild.id,
                    deny: [Permissions.FLAGS.VIEW_CHANNEL],
                },
                {
                    id: interaction.user.id,
                    allow: [Permissions.FLAGS.VIEW_CHANNEL],
                    deny: [Permissions.FLAGS.SEND_MESSAGES],
                },
                {
                    id: client.user.id,
                    allow: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.MANAGE_MESSAGES, Permissions.FLAGS.MANAGE_CHANNELS],
                },
            ]
        }).catch((err) => {return events.errorMsg(interaction, err)});

        let alertChannel = await interaction.guild.channels.create(`${interaction.user.username}#${interaction.user.discriminator}-alerts`, {
            type: 'GUILD_TEXT',
            parent: category,
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: [Permissions.FLAGS.VIEW_CHANNEL],
                },
                {
                    id: interaction.user.id,
                    allow: [Permissions.FLAGS.VIEW_CHANNEL],
                    deny: [Permissions.FLAGS.SEND_MESSAGES],
                },
                {
                    id: client.user.id,
                    allow: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.MANAGE_MESSAGES, Permissions.FLAGS.MANAGE_CHANNELS],
                },
            ]
        }).catch((err) => {return events.errorMsg(interaction, err)});;

        let helpfulButtons = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setURL('https://www.minecraft.net/en-us/login')
					.setLabel('⚙️ Account Login Portal')
					.setStyle('LINK'),
                new MessageButton()
					.setURL('https://www.minecraft.net/en-us/password/forgot')
					.setLabel('⚙️ Mojang Password Reset')
					.setStyle('LINK'),
                new MessageButton()
					.setURL('https://account.live.com/password/reset')
					.setLabel('🔁 Microsoft Password Reset')
					.setStyle('LINK'),
                new MessageButton()
					.setURL('https://support.hypixel.net/hc/en-us/articles/360019538060-Account-Security-Guide')
					.setLabel('🔒 Account Security Guide')
					.setStyle('LINK'),
			);

        let alertChannelEmbed = new MessageEmbed()
            .setTitle('Alert Channel!')
            .setDescription('Your alert messages will be sent here. You should keep notifications **on** for this channel. The command **\`/alert <blacklist, whitelist, language, session, offline, or version>\`** can individually toggle the 6 alert types, should you need to turn any of them off. By default, blacklist & whitelist alerts are off as you have not added anything to them yet.')
            .addField('Helpful Resources', 'The buttons below are links to helpful resources related to account security. You can access these at any time by viewing the pinned messagesd in this channel.')
            .setFooter(`${interaction.id} | ${new Date(Date.now() + (dst == true && dstBoolean == true ? timezone * 1 + 1: timezone) * 3600000).toLocaleTimeString('en-IN', { hour12: true })} UTC${funcImports.decimalsToUTC(dst == true && dstBoolean == true ? timezone * 1 + 1: timezone)}`, 'https://i.imgur.com/MTClkTu.png');
        alertChannel.send({ content: `${interaction.user}`, embeds: [alertChannelEmbed], components: [helpfulButtons] }).then((msg) => msg.pin()).catch((err) => {return events.errorMsg(interaction, err)});

        let logChannelEmbed = new MessageEmbed()
            .setTitle('Log Channel!')
            .setDescription('Your log messages will be sent here. You should turn notifications **off** for this channel and mute this channel. \`/monitor\` can turn the logging and monitoring on or off at your convenience; this will completely turn toggle all detection, logging, and alerts.')
            .setFooter(`${interaction.id} | ${new Date(Date.now() + (dst == true && dstBoolean == true ? timezone * 1 + 1: timezone) * 3600000).toLocaleTimeString('en-IN', { hour12: true })} UTC${funcImports.decimalsToUTC(dst == true && dstBoolean == true ? timezone * 1 + 1: timezone)}`, 'https://i.imgur.com/MTClkTu.png');
        logChannel.send({ content: `${interaction.user}`, embeds: [logChannelEmbed] }).then((msg) => msg.pin()).catch((err) => {return events.errorMsg(interaction, err)});
        
        writeData(playerData, dstBoolean, timezone, playerLogoutTime, playerLoginTime, logChannel.id, alertChannel.id)
    };

    async function writeData(playerData, dstBoolean, timezone, playerLogoutTime, playerLoginTime, logID, alertID) {
        let uuid = playerData[0].uuid,
			language = playerData[0].language ?? 'ENGLISH',
		  version = playerData[0].mc_version ?? '1.8.9',
		    login = playerData[0].last_login ?? '0',
		  logout = playerData[0].last_logout ?? '0',
          offlineTime = playerLogoutTime + " " + playerLoginTime;

        await database.newRow(`INSERT INTO users VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [interaction.user.id, `${interaction.user.username}#${interaction.user.discriminator}`, uuid, language, version, offlineTime, "", "", login, logout, timezone, dstBoolean | 0, "0 0 1 1 1 1", interaction.guild.id, logID, alertID, 1, ""]);

        setupEmbed.setColor('#00AA00');
        setupEmbed.setTitle(`Success!`);
        setupEmbed.setDescription(`You can change most of these at anytime. Check \`/help\` to see what's available. \`/monitor\` can turn the logging and monitoring on or off at your convenience; this will completely toggle all detection, logging, and alerts.`);
        setupEmbed.setFooter(`${interaction.id} | ${new Date(Date.now() + (dst == true && dstBoolean == true ? timezone * 1 + 1: timezone) * 3600000).toLocaleTimeString('en-IN', { hour12: true })} UTC${funcImports.decimalsToUTC(dst == true && dstBoolean == true ? timezone * 1 + 1: timezone)}`, 'https://i.imgur.com/MTClkTu.png');
        setupEmbed.addFields({
            name: 'Discord ID', value: `${interaction.user.id}`
          }, {name: 'Discord Tag', value: `${interaction.user.username}#${interaction.user.discriminator}`
          }, {name: 'UUID', value: `${uuid}`
          }, {name: 'Language', value: `${language}`
          }, {name: 'Version', value: `${version}`
          }, {name: 'Offline Time', value: `${twentyFourToTwelve(decimalToTime(playerLogoutTime))} to ${twentyFourToTwelve(decimalToTime(playerLoginTime))}`
          }, {name: 'UTC Offset', value: `UTC${funcImports.decimalsToUTC(dst == true && dstBoolean == true ? timezone * 1 + 1: timezone)} | Your time should be ${new Date(Date.now() + (dstBoolean == true && dst == true ? timezone * 1 + 1: timezone) * 3600000).toLocaleTimeString('en-IN', { hour12: true, timeStyle: 'short' })}`
          }, {name: 'Daylight Savings', value: `${dstBoolean == true ? `On` : `Off`}`
          }, { name: 'Log Channel', value: `<#${logID}>`
          }, {name: 'Alert Channel', value: `<#${alertID}>`
          },)
        if (playerData[0].online == true && playerData[1].online == false) setupEmbed.addField('**Limited API!**', 'Your Online API option on Hypixel was detected to being off. Please turn it on.');
		if (login == 0 || logout == 0) setupEmbed.addField('**Legacy/Unsual Login/Logout in API**', 'Your account was detected acting weird with the Slothpixel API. This problem may resolve itself, or you may need to turn off session alert types later. Contact me if you have any suggestions regarding this.');

        await interaction.followUp({ embeds: [setupEmbed] });

        console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Setup Successful!`);
        
        function twentyFourToTwelve(time) {
            time = time.toString().match(/^([01]?\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];
            if (time.length > 1) {
              time = time.slice(1);
              time[5] = +time[0] < 12 ? ' am' : ' pm';
              time[0] = +time[0] % 12 || 12;
            }
            return time.join('');
        };

        function decimalToTime(decimal) {
            let hour = Math.floor(decimal);
            let min = Math.round((decimal - hour) * 60);
            return hour + ":" + (min / 100).toFixed(2).slice(2);
        };
    }
  },
};