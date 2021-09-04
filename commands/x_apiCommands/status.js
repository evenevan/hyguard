const { MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu, Permissions } = require('discord.js');
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
  	name: 'status',
  	title: 'Displays the status of a Hypixel player',
	description: 'Displays the status of a Hypixel player. This is helpful in determining if a player was compromised.',
  	usage: `\`/status [UUID or username]\``,
  	database: false,
  	guildOnly: false,
  	ownerReq: false,
  	cooldown: 10,
    commandPermissions: [],
  	botChannelPermissions: [],
  	botGuildPermissions: [],
	async execute(interaction, client, row) {
    let readData = funcImports.readOwnerSettings();
        let api = readData.api,
		dst = readData.dst;

    let tzOffset = row ? (dst == true && row.daylightSavings == true ? row.timezone * 1 + 1: row.timezone) * 3600000 : 0;
    let tz = row ? (dst == true && row.daylightSavings == true ? row.timezone * 1 + 1: row.timezone) : 0;
    let timeString = row ? `${new Date(Date.now() + tzOffset).toLocaleTimeString('en-IN', { hour12: true })} UTC${funcImports.decimalsToUTC(tz)}` : `${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0`;

    let statusEmbed = new MessageEmbed()
        .setTimestamp()
        .setFooter(`${interaction.id} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');

    checkSystemLimits();
	async function checkSystemLimits() {
		try {
            let player = interaction.options.getString('player');
			if (api == false) { //Made this a owner setting so that APIs won't get spammed, also works for locking things down.
                statusEmbed.setColor(`#FF5555`)
                statusEmbed.setTitle(`API is down!`)
                statusEmbed.setDescription(`This command was disabled temporarily as the Hypixel API is down!`)
                console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: API Is False`);
                return await interaction.reply({ embeds: [statusEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
            }
            if (!/^[a-zA-Z0-9_-]{1,24}$/g.test(player) && !/^[0-9a-f]{8}(-?)[0-9a-f]{4}(-?)[1-5][0-9a-f]{3}(-?)[89AB][0-9a-f]{3}(-?)[0-9a-f]{12}$/i.test(player)) {
                statusEmbed.setColor(`#FF5555`);
                statusEmbed.setTitle(`Invalid Username or UUID!`);
                statusEmbed.setDescription(`The username/UUID provided is invalid! The username cannot contain invalid characters. UUIDs must match the following regex: \`/^[0-9a-f]{8}[0-9a-f]{4}[1-5][0-9a-f]{3}[89AB][0-9a-f]{3}[0-9a-f]{12}$/i\`. You can test this regex on [__this__](https://regex101.com/r/97kmf3/1) site.`);
                console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Invalid Player/UUID`);
                return await interaction.reply({ embeds: [statusEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                //Testing for invalid strings that may cause a TypeError: Request path contains unescaped characters.
            }
            await interaction.deferReply({ ephemeral: true }); //In case the API requests below take more than the 3 seconds the interaction gets
			if (/^[0-9a-f]{8}(-?)[0-9a-f]{4}(-?)[1-5][0-9a-f]{3}(-?)[89AB][0-9a-f]{3}(-?)[0-9a-f]{12}$/i.test(player)) return requestPlayer(player);
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
            }).then(function(response) {
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
                statusEmbed.setColor('#AA0000');
                statusEmbed.setTitle(`Abort Error!`);
                statusEmbed.setDescription('The Mojang API failed to respond, and may be down. Try with a UUID if this error continues.');
                console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Mojang Abort Error`);
                return await interaction.editReply({ embeds: [statusEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
            } else if (err.name === "NotFound") {
                statusEmbed.setColor(`#FF5555`); statusEmbed.setTitle(`Player Not Found!`);
                statusEmbed.setDescription(`Your Minecraft username doesn\'t seem to exist or hasn\'t logged onto Hypixel.`);
                console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Mojang Player Not Found`);
                return await interaction.editReply({ embeds: [statusEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
            } else {
                return events.errorMsg(interaction, err);
            }
          });
    };

    async function requestPlayer(uuid, undefinedIfHasntAborted) {
        let controller = new AbortController();
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
            if (player.hasOwnProperty('error')) {let newError = new Error(player.error); newError.name = "PlayerError"; throw newError;}
            returnData(player[0], player[1]);
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
                statusEmbed.setColor('#AA0000');
                statusEmbed.setTitle(`Abort Error!`);
                statusEmbed.setDescription('The Slothpixel API failed to respond, and may be down. Try again later.');
                console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Slothpixel Abort Error`);
                return await interaction.editReply({ embeds: [statusEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
            } else if (err.name === "NotFound") {
                statusEmbed.setColor(`#FF5555`); statusEmbed.setTitle(`Player Not Found!`);
                statusEmbed.setDescription(`Your Minecraft username doesn\'t seem to exist or hasn\'t logged onto Hypixel.`);
                console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Slothpixel Player Not Found`);
                return await interaction.editReply({ embeds: [statusEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
            } else {
                return events.errorMsg(interaction, err);
            }
        });
    }

    async function returnData(playerData, statusData) {
        let timeSinceLastLogin = `${secondsToDays(new Date() - playerData.last_login)}${new Date(new Date() - playerData.last_login).toISOString().substr(11, 8)}`;
        let timeSincefLastLogout = `${secondsToDays(new Date() - playerData.last_logout)}${new Date(new Date() - playerData.last_logout).toISOString().substr(11, 8)}`;

        let timestampOfLastLogin = funcImports.epochToCleanDate(new Date(playerData.last_login + tzOffset)) + ", " + new Date(playerData.last_login + tzOffset).toLocaleTimeString('en-IN', { hour12: true });
        let timestampOfLastLogout = funcImports.epochToCleanDate(new Date(playerData.last_logout + tzOffset)) + ", " + new Date(playerData.last_logout + tzOffset).toLocaleTimeString('en-IN', { hour12: true });

        let lastPlaytime = `${secondsToDays(playerData.last_logout - playerData.last_login)}${new Date(playerData.last_logout - playerData.last_login).toISOString().substr(11, 8)}`;

        function secondsToDays(ms) { //calculating days from seconds
            ms = ms / 1000
            let day = Math.floor(ms / (3600 * 24));
            let days = day > 0 ? day + (day == 1 ? ' day ' : ' days ') : '';
            return days;
        };

          statusEmbed.setColor('#7289DA');
          statusEmbed.setTitle(`Status of ${playerData.username}`);
          statusEmbed.setDescription(`Data is not quite real-time, and some fields may be inaccurate. Gathered with the Slothpixel API.`);
          statusEmbed.setFooter(`${interaction.id} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');
          statusEmbed.addField(`Status`, `${playerData.username} is ${statusData.online ? 'online' : 'offline'}`)
          statusEmbed.addField(`UUID`, playerData.uuid);
        if (!statusData.online) {
          statusEmbed.addFields(
          { name: 'Last Session', value: `${playerData.last_login && playerData.last_login < playerData.last_logout ? `Last Playtime: ${lastPlaytime} long` : `Playtime: Unknown`}\n${playerData.last_game ? `Last Gametype: ${playerData.last_game}` : `Last Gametype: Unknown` }` },);
        } else {
          statusEmbed.addFields(
          { name: 'Session', value: `${playerData.last_login ? `Playtime: ${timeSinceLastLogin}` : `Playtime: Unknown`}\n${statusData.game.type ? `Game: ${statusData.game.type}\n` : `` }${statusData.game.mode ? `Mode: ${statusData.game.mode}\n` : `` }${statusData.game.map ? `Map: ${statusData.game.map}` : `` }${!statusData.game.type && !statusData.game.mode && !statusData.game.map ? `Data not available: Limited API!` : `` }` });
        }
          statusEmbed.addField('Last Login', playerData.last_login ? `${timestampOfLastLogin}\n${timeSinceLastLogin} ago` : `Unknown`);
          statusEmbed.addField('Last Logout', playerData.last_logout ? `${timestampOfLastLogout}\n${timeSincefLastLogout} ago` : `Unknown`);
          statusEmbed.addField('Settings', `${playerData.language ? `Language: ${playerData.language}` : `Language: Unknown`}\n${playerData.mc_version ? `Version: ${playerData.mc_version}` : `Version: Unknown`}`);

        let playerPossesive = playerData.username.endsWith('s') ? `${playerData.username}'` : `${playerData.username}'s`

        if (statusData.game.type || playerData.last_game) switch (statusData.game.type || playerData.last_game) {
            case 'Bed Wars':
            case 'BedWars':
                statusEmbed.addField(`${playerPossesive} Stats for Bed Wars`, `Level: ${playerData.stats.BedWars.level}\nCoins: ${playerData.stats.BedWars.coins}\nTotal Games Joined: ${playerData.stats.BedWars.games_played}\nWinstreak: ${playerData.stats.BedWars.winstreak}\nFinal K/D: ${playerData.stats.BedWars.final_k_d}\nK/D: ${playerData.stats.BedWars.k_d}`);
              break;
            case 'Duels':
                statusEmbed.addField(`${playerPossesive} Stats for Duels`, `Coins: ${playerData.stats.Duels.general.coins}\nCosmetic Count: ${playerData.stats.Duels.general.packages.length}\nK/D Ratio: ${playerData.stats.Duels.general.kd_ratio}\nW/L Ratio: ${playerData.stats.Duels.general.win_loss_ratio}\nWins: ${playerData.stats.Duels.general.wins}\nKills: ${playerData.stats.Duels.general.kills}\nDeaths: ${playerData.stats.Duels.general.deaths}`);
              break;
            case 'Blitz Survival Games':
            case 'Blitz':
                statusEmbed.addField(`${playerPossesive} Stats for Blitz Survival`, `Coins: ${playerData.stats.Blitz.coins}\nK/D Ratio: ${playerData.stats.Blitz.k_d}\nW/L Ratio: ${playerData.stats.Blitz.win_loss}\nWins: ${playerData.stats.Blitz.wins}\nKills: ${playerData.stats.Blitz.kills}\nDeaths: ${playerData.stats.Blitz.deaths}`);
              break;
            case 'Pit':
                statusEmbed.addField(`${playerPossesive} Stats for the Pit`, `Total Gold Earned: ${playerData.stats.Pit.gold_earned}\nPrestige: ${playerData.stats.Pit.prestige}\nPlaytime: ${playerData.stats.Pit.playtime_minutes} minutes\nBest Streak: ${playerData.stats.Pit.max_streak}\nChat Messages: ${playerData.stats.Pit.chat_messages}\nK/D Ratio: ${playerData.stats.Pit.kd_ratio}\nKills: ${playerData.stats.Pit.kills}\nDeaths: ${playerData.stats.Pit.deaths}`);
              break;
            case 'SkyWars':
                statusEmbed.addField(`${playerPossesive} Stats for SkyWars`, `Level: ${playerData.stats.SkyWars.level}\nCoins: ${playerData.stats.SkyWars.coins}\nK/D Ratio: ${playerData.stats.SkyWars.kill_death_ratio}\nW/L Ratio: ${playerData.stats.SkyWars.win_loss_ratio}\nWins: ${playerData.stats.SkyWars.wins}\nKills: ${playerData.stats.SkyWars.kills}\nDeaths: ${playerData.stats.SkyWars.deaths}`);
              break;
            case 'Speed UHC':
            case 'SpeedUHC':
                statusEmbed.addField(`${playerPossesive} Stats for Speed UHC`, `Coins: ${playerData.stats.SpeedUHC.coins}\nK/D Ratio: ${playerData.stats.SpeedUHC.kd}\nW/L Ratio: ${playerData.stats.SpeedUHC.win_loss}\nWins: ${playerData.stats.SpeedUHC.wins}\nKills: ${playerData.stats.SpeedUHC.kills}\nDeaths: ${playerData.stats.SpeedUHC.deaths}`);
              break;
            case 'UHC Champions':
            case 'UHC':
                statusEmbed.addField(`${playerPossesive} Stats for UHC Champions`, `Level: ${playerData.stats.UHC.level}\nCoins: ${playerData.stats.UHC.coins}\nK/D Ratio: ${playerData.stats.UHC.kd}\nW/L Ratio: ${playerData.stats.UHC.win_loss}\nWins: ${playerData.stats.UHC.wins}\nKills: ${playerData.stats.UHC.kills}\nDeaths: ${playerData.stats.UHC.deaths}`);
              break;
            case 'Walls':
                statusEmbed.addField(`${playerPossesive} Stats for the Walls`, `Coins: ${playerData.stats.Walls.coins}\nK/D Ratio: ${playerData.stats.Walls.kd}\nW/L Ratio: ${playerData.stats.Walls.win_loss}\nWins: ${playerData.stats.Walls.wins}\nKills: ${playerData.stats.Walls.kills}\nDeaths: ${playerData.stats.Walls.deaths}`);
              break;
            case 'Mega Walls':
            case 'MegaWalls':
                statusEmbed.addField(`${playerPossesive} Stats for Mega Walls`, `Coins: ${playerData.stats.MegaWalls.coins}\nK/D Ratio: ${playerData.stats.MegaWalls.kill_death_ratio}\nW/L Ratio: ${playerData.stats.MegaWalls.win_loss_ratio}\nWins: ${playerData.stats.MegaWalls.wins}\nKills: ${playerData.stats.MegaWalls.kills}\nDeaths: ${playerData.stats.MegaWalls.deaths}`);
              break;
            default:
                statusEmbed.addField(`${playerPossesive} Stats for the gametype ${statusData.game.type || playerData.last_game}`, `Basic stats are not currently available for the gametype ${statusData.game.type || playerData.last_game}`);
        }

        if (!statusData.online && (playerData.last_logout < playerData.last_login)) statusEmbed.addField(`**API Limitation**`, `There may be some sort of API limitation which hides some information about this player.`);

        return await interaction.editReply({ embeds: [statusEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
    }
  },
};