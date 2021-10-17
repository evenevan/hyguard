/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable no-prototype-builtins */
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const funcImports = require('../../functions.js');
const events = require('../../events.js');
const fetch = require('node-fetch');
const fetchTimeout = (url, ms, { signal, ...options } = {}) => {
    const controller = new AbortController();
    const promise = fetch(url, { signal: controller.signal, ...options });
    if (signal) signal.addEventListener("abort", () => controller.abort());
    const timeout = setTimeout(() => controller.abort(), ms);
    return promise.finally(() => clearTimeout(timeout));
};
module.exports = {
  	name: 'recentgames',
  	title: 'Displays the recent games of a Hypixel player',
	description: 'Displays the recent games of a Hypixel player. This command offers a neat button interaction system.',
  	usage: `\`/recentgames [UUID or username]\``,
  	database: false,
  	guildOnly: true,
  	ownerReq: false,
  	cooldown: 10,
    commandPermissions: [],
  	botChannelPermissions: [],
  	botGuildPermissions: [],
	async execute(interaction, row) {
    let readData = funcImports.readOwnerSettings();
    let api = readData.api,
		dst = readData.dst;

    let tzOffset = row ? (dst == true && row.daylightSavings == true ? row.timezone * 1 + 1: row.timezone) * 3600000 : 0;
    let tz = row ? (dst == true && row.daylightSavings == true ? row.timezone * 1 + 1: row.timezone) : 0;
    let timeString = row ? `${new Date(Date.now() + tzOffset).toLocaleTimeString('en-IN', { hour12: true })} UTC${funcImports.decimalsToUTC(tz)}` : `${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC +0`;

    let recentEmbed = new MessageEmbed()
        .setTimestamp()
        .setFooter(`${interaction.id} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');

    checkSystemLimits();
	async function checkSystemLimits() {
		try {
            let player = interaction.options.getString('player');
			if (api == false) { //Made this a owner setting so that APIs won't get spammed, also works for locking things down.
                recentEmbed.setColor(`#FF5555`)
                recentEmbed.setTitle(`API is down!`)
                recentEmbed.setDescription(`This command was disabled temporarily as the Hypixel API is down!`)
                console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: API Is False`);
                return await interaction.reply({ embeds: [recentEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
            }
            if (!/^[a-zA-Z0-9_-]{1,24}$/g.test(player) && !/^[0-9a-f]{8}(-?)[0-9a-f]{4}(-?)[1-5][0-9a-f]{3}(-?)[89AB][0-9a-f]{3}(-?)[0-9a-f]{12}$/i.test(player)) {
                recentEmbed.setColor(`#FF5555`);
                recentEmbed.setTitle(`Invalid Username or UUID!`);
                recentEmbed.setDescription(`The username/UUID provided is invalid! The username cannot contain invalid characters. UUIDs must match the following regex: \`/^[0-9a-f]{8}[0-9a-f]{4}[1-5][0-9a-f]{3}[89AB][0-9a-f]{3}[0-9a-f]{12}$/i\`. You can test this regex with [__this__](https://regex101.com/r/A866mm/1) site.`);
                console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Invalid Player Name/UUID`);
                return await interaction.reply({ embeds: [recentEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                //Testing for invalid strings that may cause a TypeError: Request path contains unescaped characters.
            }
            await interaction.deferReply({ ephemeral: true }); //In case the API requests below take more than the 3 seconds the interaction gets
			if (/^[0-9a-f]{8}(-?)[0-9a-f]{4}(-?)[1-5][0-9a-f]{3}(-?)[89AB][0-9a-f]{3}(-?)[0-9a-f]{12}$/i.test(player)) return requestUsername(player);
            requestUUID(player);
		} catch (err) {
			events.errorMsg(interaction, err)
		}
	}

    async function requestUUID(username, undefinedIfHasntAborted) {
        let controller = new AbortController();
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
                requestUsername(response[0].id);
            })
            .catch(async (err) => {
                if (err.name === "AbortError") {
                    if (undefinedIfHasntAborted === undefined) {
                        recentEmbed.setColor('#FF5555');
                        recentEmbed.setTitle(`Connection Failed!`);
                        recentEmbed.setDescription('The Mojang API failed to respond, trying again..');
                        await interaction.editReply({ embeds: [recentEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                        return requestUUID(username, true);
                    }
                    recentEmbed.setColor('#AA0000');
                    recentEmbed.setTitle(`Abort Error!`);
                    recentEmbed.setDescription('The Mojang API failed to respond, and may be down. Try with a UUID if this error continues.');
                    console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Mojang Abort Error`);
                    return await interaction.editReply({ embeds: [recentEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                } else if (err.name === "NotFound") {
                    recentEmbed.setColor(`#FF5555`); recentEmbed.setTitle(`Player Not Found!`);
                    recentEmbed.setDescription(`That Minecraft username doesn't seem to exist or hasn't logged onto Hypixel.`);
                    console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Mojang Player Not Found`);
                    return await interaction.editReply({ embeds: [recentEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                } else {
                    return events.errorMsg(interaction, err);
                }
            });
    }

    async function requestUsername(uuid, undefinedIfHasntAborted) {
        let controller = new AbortController();
        Promise.all([
            fetchTimeout(`https://api.mojang.com/user/profiles/${uuid}/names`, 2000, {
                signal: controller.signal
              }).then(function(response) {
                if (response.status === 204) {let newError = new Error("HTTP status " + response.status); newError.name = "NotFound"; throw newError;}
                if (!response.ok) {let newError = new Error("HTTP status " + response.status); newError.name = "HTTPError"; throw newError;}
                return response.json();
              }),
          ])
            .then((response) => {
                requestPlayer(uuid, response[0][response[0].length - 1].name);
            })
            .catch(async (err) => {
                if (err.name === "AbortError") {
                    if (undefinedIfHasntAborted === undefined) {
                        recentEmbed.setColor('#FF5555');
                        recentEmbed.setTitle(`Connection Failed!`);
                        recentEmbed.setDescription('The Mojang API failed to respond, trying again..');
                        await interaction.editReply({ embeds: [recentEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                        return requestUsername(uuid, true);
                    }
                    recentEmbed.setColor('#AA0000');
                    recentEmbed.setTitle(`Abort Error!`);
                    recentEmbed.setDescription('The Mojang API failed to respond, and may be down. Try with a username if this error continues.');
                    console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Mojang Abort Error`);
                    return await interaction.editReply({ embeds: [recentEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                } else if (err.name === "NotFound") {
                    recentEmbed.setColor(`#FF5555`); recentEmbed.setTitle(`Player Not Found!`);
                    recentEmbed.setDescription(`That Minecraft username doesn't seem to exist or hasn't logged onto Hypixel.`);
                    console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Mojang Player Not Found`);
                    return await interaction.editReply({ embeds: [recentEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                } else {
                    return events.errorMsg(interaction, err);
                }
            });
    }

    async function requestPlayer(uuid, playerName, undefinedIfHasntAborted) {
        let controller = new AbortController();
        Promise.all([
            fetchTimeout(`https://api.slothpixel.me/api/players/${uuid}/recentGames`, 2000, {
                signal: controller.signal
              }).then(function(response) {
                if (response.status === 404) {let newError = new Error("HTTP status " + response.status); newError.name = "NotFound"; throw newError;}
                if (!response.ok) {let newError = new Error("HTTP status " + response.status); newError.name = "HTTPError"; throw newError;}
                return response.json();
              }),
          ])
          .then((player) => {
            if (player.hasOwnProperty('error')) {let newError = new Error(player.error); newError.name = "PlayerError"; throw newError;}
            returnData(player, playerName);
          })
          .catch(async (err) => {
            if (err.name === "AbortError") {
                if (undefinedIfHasntAborted === undefined) {
                    recentEmbed.setColor('#FF5555');
                    recentEmbed.setTitle(`Connection Failed!`);
                    recentEmbed.setDescription('The Slothpixel API failed to respond, trying again..');
                    await interaction.editReply({ embeds: [recentEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                    return requestPlayer(uuid, playerName, true);
                }
                recentEmbed.setColor('#AA0000');
                recentEmbed.setTitle(`Abort Error!`);
                recentEmbed.setDescription('The Slothpixel API failed to respond, and may be down. Try again later.');
                console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Slothpixel Abort Error`);
                return await interaction.editReply({ embeds: [recentEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
            } else if (err.name === "NotFound") {
                recentEmbed.setColor(`#FF5555`); recentEmbed.setTitle(`Player Not Found!`);
                recentEmbed.setDescription(`That Minecraft username doesn't seem to exist or hasn't logged onto Hypixel.`);
                console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Slothpixel Player Not Found`);
                return await interaction.editReply({ embeds: [recentEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
            } else {
                return events.errorMsg(interaction, err);
            }
        });
    }

    async function returnData(recentData, playerName) {

        if (recentData[0].length === 0) {
                recentEmbed.setColor('#FF5555')
                recentEmbed.setTitle(`Most Recent Games - ${playerName}`)
                recentEmbed.addField(`No Recent Games Detected!`, `There are no recent games to show. Games played more than 3 days ago cannot be shown. Some players also have the recent games API option disabled.`)
            return await interaction.editReply({  embeds: [recentEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
        }

        const generateEmbed = start => {
            const current = recentData[0].slice(start, start + 5);

            const recentGamesEmbed = new MessageEmbed()
                .setColor('#7289DA')
                .setTitle(`Recent Games - ${playerName} | Showing ${start + 1}-${start + current.length} out of ${recentData[0].length}`)
                .setDescription(`Some gametypes like Skyblock will not show up due to limitations with Hypixel's API. Games may take a while to appear here due to use of the Slothpixel API.`)
                .setTimestamp()
                .setFooter(`${interaction.id} | ${row ? `${new Date(Date.now() + tzOffset).toLocaleTimeString('en-IN', { hour12: true })} UTC${funcImports.decimalsToUTC(tz)}` : `${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC +0`}`, 'https://i.imgur.com/MTClkTu.png');
            for (let i = start; i < start + 5; i++) {
                if (recentData[0][i]) {
                    let header = `${recentData[0][i].gameType} | ${funcImports.epochToCleanDate(new Date(recentData[0][i].date + tzOffset))} | UTC ${funcImports.decimalsToUTC(tz)}`
                    let bodyText = `${recentData[0][i].hasOwnProperty("date") && recentData[0][i].date ? `Game Start: ${new Date(recentData[0][i].date + tzOffset).toLocaleTimeString('en-IN', { hour12: true })}` : `Game Start: Unknown`}\n`
                    bodyText += `${recentData[0][i].hasOwnProperty('ended') && recentData[0][i].ended ? `Game End: ${new Date(recentData[0][i].ended + tzOffset).toLocaleTimeString('en-IN', { hour12: true })}` : `Game End: In progress`}\n`
                    bodyText += `${recentData[0][i].hasOwnProperty('ended') && recentData[0][i].ended ? `Play Time: ${new Date(recentData[0][i].ended - recentData[0][i].date).toISOString().substr(11, 8)}\n` : `Play Time Elapsed: ${new Date(Date.now() - recentData[0][i].date).toISOString().substr(11, 8)}\n` }`
                    bodyText += `${recentData[0][i].mode ? `Mode: ${recentData[0][i].mode}\n` : `` }`
                    bodyText += `${recentData[0][i].map !== null && recentData[0][i].map !== "" ? `Map: ${recentData[0][i].map}` : `` }`
                    recentGamesEmbed.addField(header, bodyText)
                }
            }
            return recentGamesEmbed;
        }

        let leftDisabledButton = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setCustomId('placeholder')
					.setLabel('<')
					.setStyle('PRIMARY')
                    .setDisabled(true),
                new MessageButton()
					.setCustomId('forward1')
					.setLabel('>')
					.setStyle('PRIMARY'),
			);

         let bothEnabledButton = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setCustomId('backward')
					.setLabel('<')
					.setStyle('PRIMARY'),
                new MessageButton()
					.setCustomId('forward')
					.setLabel('>')
					.setStyle('PRIMARY'),
			);

         let rightDisabledButton = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setCustomId('backward1')
					.setLabel('<')
					.setStyle('PRIMARY'),
                new MessageButton()
					.setCustomId('placeholder1')
					.setLabel('>')
					.setStyle('PRIMARY')
                    .setDisabled(true),
			);

        let bothDisabledButton = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setCustomId('placeholder2')
					.setLabel('<')
					.setStyle('PRIMARY')
                    .setDisabled(true),
                new MessageButton()
					.setCustomId('placeholder3')
					.setLabel('>')
					.setStyle('PRIMARY')
                    .setDisabled(true),
			);

        if (recentData[0].length <= 5) return await interaction.editReply({ embeds: [generateEmbed(0)], components: [bothDisabledButton], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});

        await interaction.editReply({ embeds: [generateEmbed(0)], components: [leftDisabledButton], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});

            const filter = i => i.customId === 'forward' || i.customId === 'backward' || i.customId === 'forward1' || i.customId === 'backward1' && i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, componentType: 'BUTTON', time: 300000 });

            let currentIndex = 0

            collector.on('collect', async i => { //.update provides a way of updating ephermerals without having that stupid (edited) timestamp thing. It's awesome.
                if (i.customId === 'forward' || i.customId === 'forward1') {
                    currentIndex += 5
                    await i.update({ embeds: [generateEmbed(currentIndex)], components: [currentIndex + 5 < recentData[0].length ? bothEnabledButton : rightDisabledButton], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                } else if (i.customId === 'backward' || i.customId === 'backward1') {
                    currentIndex -= 5
                    await i.update({ embeds: [generateEmbed(currentIndex)], components: [currentIndex > 0 ? bothEnabledButton : leftDisabledButton], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                }
            });

            collector.on('end', async () => {
                return await interaction.editReply({ embeds:[generateEmbed(currentIndex)], components: [bothDisabledButton], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
            });

    }
  },
};