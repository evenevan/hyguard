const { MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu, Permissions } = require('discord.js');
const funcImports = require('../../functions.js');
const events = require('../../events.js');
const fetch = require('node-fetch');
const controller = new AbortController();
const fetchTimeout = (url, ms, { signal, ...options } = {}) => {
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
            return await interaction.reply({ embeds: [statusEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
            }
            if (!/^[a-zA-Z0-9_-]{1,24}$/g.test(player) && !/^[0-9a-f]{8}(-?)[0-9a-f]{4}(-?)[1-5][0-9a-f]{3}(-?)[89AB][0-9a-f]{3}(-?)[0-9a-f]{12}$/i.test(player)) {
                statusEmbed.setColor(`#FF5555`);
                statusEmbed.setTitle(`Invalid Username or UUID!`);
                statusEmbed.setDescription(`The username/UUID provided is invalid! The username cannot contain invalid characters. UUIDs must match the following regex: \`/^[0-9a-f]{8}[0-9a-f]{4}[1-5][0-9a-f]{3}[89AB][0-9a-f]{3}[0-9a-f]{12}$/i\`. You can test this regex on [__this__](https://regex101.com/r/97kmf3/1) site.`);
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

    async function requestUUID(username) {
        fetchTimeout(`https://api.mojang.com/users/profiles/minecraft/${username}`, 5000, {
                signal: controller.signal
            })
            .then(function(response) {
              if (response.status === 204) {let newError = new Error("HTTP status " + response.status); newError.name = "NotFound"; throw newError;}
              if (!response.ok) {throw new Error("HTTP status " + response.status);}
              return response.json();
            })
            .then((response) => {
                requestPlayer(response.id);
            })
            .catch(async (err) => {
                if (err.name === "AbortError") {
                    statusEmbed.setColor('#AA0000');
                    statusEmbed.setTitle(`Abort Error!`);
                    statusEmbed.setDescription('The Mojang API failed to respond, and may be down. Try again later.');
                  return await interaction.editReply({ embeds: [statusEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                } else if (err.name === "NotFound") {
                    statusEmbed.setColor(`#FF5555`); statusEmbed.setTitle(`Player Not Found!`);
                    statusEmbed.setDescription(`Your Minecraft username doesn\'t seem to exist or hasn\'t logged onto Hypixel.`);
                    return await interaction.editReply({ embeds: [statusEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                } else {
                    return events.errorMsg(interaction, err);
                }
            });
    };

    async function requestPlayer(uuid) {
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
            returnData(player);
          })
          .catch(async (err) => {
            if (err.name === "AbortError") {
                statusEmbed.setColor('#AA0000');
                statusEmbed.setTitle(`Abort Error!`);
                statusEmbed.setDescription('The Slothpixel API failed to respond, and may be down. Try again later.');
              return await interaction.editReply({ embeds: [statusEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
            } else if (err.name === "NotFound") {
                statusEmbed.setColor(`#FF5555`); statusEmbed.setTitle(`Player Not Found!`);
                statusEmbed.setDescription(`Your Minecraft username doesn\'t seem to exist or hasn\'t logged onto Hypixel.`);
                return await interaction.editReply({ embeds: [statusEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
            } else {
                return events.errorMsg(interaction, err);
            }
        });
    }

    async function returnData(player) {
        let timeSinceLastLogin = `${secondsToDays(new Date() - player[0].last_login)}${new Date(new Date() - player[0].last_login).toISOString().substr(11, 8)}`;
        let timeSincefLastLogout = `${secondsToDays(new Date() - player[0].last_logout)}${new Date(new Date() - player[0].last_logout).toISOString().substr(11, 8)}`;

        let timestampOfLastLogin = funcImports.epochToCleanDate(new Date(player[0].last_login + tzOffset)) + ", " + new Date(player[0].last_login + tzOffset).toLocaleTimeString('en-IN', { hour12: true });
        let timestampOfLastLogout = funcImports.epochToCleanDate(new Date(player[0].last_logout + tzOffset)) + ", " + new Date(player[0].last_logout + tzOffset).toLocaleTimeString('en-IN', { hour12: true });

        let lastPlaytime = `${secondsToDays(player[0].last_logout - player[0].last_login)}${new Date(player[0].last_logout - player[0].last_login).toISOString().substr(11, 8)}`;

        function secondsToDays(ms) { //calculating days from seconds
            ms = ms / 1000
            let day = Math.floor(ms / (3600 * 24));
            let days = day > 0 ? day + (day == 1 ? ' day ' : ' days ') : '';
            return days;
        };

            statusEmbed.setColor('#7289DA');
            statusEmbed.setTitle(`Status of ${player[0].username}`);
            statusEmbed.setDescription(`Data is not quite real-time, and some fields may be inaccurate. Gathered with the Slothpixel API.`);
            statusEmbed.setFooter(`${interaction.id} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');
        if (!player[1].online) {
             statusEmbed.addFields({ name: 'Status', value: `${player[0].username} is offline` }, { name: 'UUID', value: `${player[0].uuid}` }, { name: 'Last Session', value: `${player[0].last_login && player[0].last_logout ? `Last Playtime: ${lastPlaytime} long` : `Playtime: Unknown`}\n${player[0].last_game ? `Last Game Played: ${player[0].last_game}` : `Last Game Played: Unknown` }` }, { name: 'Last Login', value: `${player[0].last_login ? `${timestampOfLastLogin} UTC ${funcImports.decimalsToUTC(tz)}\n${timeSinceLastLogin} ago` : `Unknown` }` }, { name: 'Last Logout', value: `${player[0].last_logout ? `${timestampOfLastLogout} UTC ${funcImports.decimalsToUTC(tz)}\n${timeSincefLastLogout} ago` : `Unknown` }` }, { name: 'Settings', value: `${player[0].language ? `Language: ${player[0].language}` : `Language: Unknown` }\n${player[0].mc_version ? `Version: ${player[0].mc_version}` : `Version: Unknown` }` });
            if (!player[1].online && (player[0].last_logout < player[0].last_login * 1)) statusEmbed.addField(`**API Limitation**`, `There is a possible API limitation which hides some information.`);
        } else if (player[1].online) {
            statusEmbed.addFields({ name: 'Status', value: `${player[0].username} is online` }, { name: 'UUID', value: `${player[0].uuid}` }, { name: 'Session', value: `${player[0].last_login ? `Playtime: ${timeSinceLastLogin}` : `Playtime: Unknown`}\n${player[0].last_game ? `Last Game Played: ${player[0].last_game}` : `Last Game Played: Unknown` }\n${player[1].game.type ? `Current Game: ${player[1].game.type}\n` : `` }${player[1].game.mode ? `Mode: ${player[1].game.mode}\n` : `` }${player[1].game.map ? `Map: ${player[1].game.map}` : `` }${!player[1].game.type && !player[1].game.mode && !player[1].game.map ? `Data not available: Limited API!` : `` }` }, { name: 'Last Login', value: `${player[0].last_login ? `${timestampOfLastLogin} UTC ${funcImports.decimalsToUTC(tz)}\n${timeSinceLastLogin} ago` : `Last Login: Unknown`}` }, { name: 'Last Logout', value: `${player[0].last_logout ? `${timestampOfLastLogout} UTC ${funcImports.decimalsToUTC(tz)}\n${timeSincefLastLogout} ago` : `Last Logout: Unknown`}` }, { name: 'Settings', value: `${player[0].language ? `Language: ${player[0].language}` : `Language: Unknown` }\n${player[0].mc_version ? `Version: ${player[0].mc_version}` : `Version: Unknown` }` });
        }

        let playerPossesive = player[0].username.endsWith('s') ? `${player[0].username}'` : `${player[0].username}'s`

        if (player[1].game.type || player[0].last_game) switch (player[1].game.type || player[0].last_game) {
            case 'Bed Wars':
            case 'BedWars':
                statusEmbed.addField(`${playerPossesive} Stats for Bed Wars`, `Level: ${player[0].stats.BedWars.level}\nCoins: ${player[0].stats.BedWars.coins}\nTotal Games Joined: ${player[0].stats.BedWars.games_played}\nWinstreak: ${player[0].stats.BedWars.winstreak}\nFinal K/D: ${player[0].stats.BedWars.final_k_d}\nK/D: ${player[0].stats.BedWars.k_d}`);
              break;
            case 'Duels':
                statusEmbed.addField(`${playerPossesive} Stats for Duels`, `Coins: ${player[0].stats.Duels.general.coins}\nCosmetic Count: ${player[0].stats.Duels.general.packages.length}\nK/D Ratio: ${player[0].stats.Duels.general.kd_ratio}\nW/L Ratio: ${player[0].stats.Duels.general.win_loss_ratio}\nWins: ${player[0].stats.Duels.general.wins}\nKills: ${player[0].stats.Duels.general.kills}\nDeaths: ${player[0].stats.Duels.general.deaths}`);
              break;
            case 'Blitz Survival Games':
            case 'Blitz':
                statusEmbed.addField(`${playerPossesive} Stats for Blitz Survival`, `Coins: ${player[0].stats.Blitz.coins}\nK/D Ratio: ${player[0].stats.Blitz.k_d}\nW/L Ratio: ${player[0].stats.Blitz.win_loss}\nWins: ${player[0].stats.Blitz.wins}\nKills: ${player[0].stats.Blitz.kills}\nDeaths: ${player[0].stats.Blitz.deaths}`);
              break;
            case 'Pit':
                statusEmbed.addField(`${playerPossesive} Stats for the Pit`, `Total Gold Earned: ${player[0].stats.Pit.gold_earned}\nPrestige: ${player[0].stats.Pit.prestige}\nPlaytime: ${player[0].stats.Pit.playtime_minutes} minutes\nBest Streak: ${player[0].stats.Pit.max_streak}\nChat Messages: ${player[0].stats.Pit.chat_messages}\nK/D Ratio: ${player[0].stats.Pit.kd_ratio}\nKills: ${player[0].stats.Pit.kills}\nDeaths: ${player[0].stats.Pit.deaths}`);
              break;
            case 'SkyWars':
                statusEmbed.addField(`${playerPossesive} Stats for SkyWars`, `Level: ${player[0].stats.SkyWars.level}\nCoins: ${player[0].stats.SkyWars.coins}\nK/D Ratio: ${player[0].stats.SkyWars.kill_death_ratio}\nW/L Ratio: ${player[0].stats.SkyWars.win_loss_ratio}\nWins: ${player[0].stats.SkyWars.wins}\nKills: ${player[0].stats.SkyWars.kills}\nDeaths: ${player[0].stats.SkyWars.deaths}`);
              break;
            case 'Speed UHC':
            case 'SpeedUHC':
                statusEmbed.addField(`${playerPossesive} Stats for Speed UHC`, `Coins: ${player[0].stats.SpeedUHC.coins}\nK/D Ratio: ${player[0].stats.SpeedUHC.kd}\nW/L Ratio: ${player[0].stats.SpeedUHC.win_loss}\nWins: ${player[0].stats.SpeedUHC.wins}\nKills: ${player[0].stats.SpeedUHC.kills}\nDeaths: ${player[0].stats.SpeedUHC.deaths}`);
              break;
            case 'UHC Champions':
            case 'UHC':
                statusEmbed.addField(`${playerPossesive} Stats for UHC Champions`, `Level: ${player[0].stats.UHC.level}\nCoins: ${player[0].stats.UHC.coins}\nK/D Ratio: ${player[0].stats.UHC.kd}\nW/L Ratio: ${player[0].stats.UHC.win_loss}\nWins: ${player[0].stats.UHC.wins}\nKills: ${player[0].stats.UHC.kills}\nDeaths: ${player[0].stats.UHC.deaths}`);
              break;
            case 'Walls':
                statusEmbed.addField(`${playerPossesive} Stats for the Walls`, `Coins: ${player[0].stats.Walls.coins}\nK/D Ratio: ${player[0].stats.Walls.kd}\nW/L Ratio: ${player[0].stats.Walls.win_loss}\nWins: ${player[0].stats.Walls.wins}\nKills: ${player[0].stats.Walls.kills}\nDeaths: ${player[0].stats.Walls.deaths}`);
              break;
            case 'Mega Walls':
            case 'MegaWalls':
                statusEmbed.addField(`${playerPossesive} Stats for Mega Walls`, `Coins: ${player[0].stats.MegaWalls.coins}\nK/D Ratio: ${player[0].stats.MegaWalls.kill_death_ratio}\nW/L Ratio: ${player[0].stats.MegaWalls.win_loss_ratio}\nWins: ${player[0].stats.MegaWalls.wins}\nKills: ${player[0].stats.MegaWalls.kills}\nDeaths: ${player[0].stats.MegaWalls.deaths}`);
              break;
            default:
                statusEmbed.addField(`${playerPossesive} Stats for the gametype ${player[1].game.type || player[0].last_game}`, `Basic stats are not currently available for the gametype ${player[1].game.type || player[0].last_game}`);
        }

        return await interaction.editReply({ embeds: [statusEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
    }
  },
};