/* eslint-disable no-prototype-builtins */
/* eslint-disable no-mixed-spaces-and-tabs */
const { MessageEmbed } = require('discord.js');
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
  	name: 'compromised',
  	title: 'Displays stats and data of a Hypixel player in BB code',
	  description: 'Displays stats and data of a Hypixel player to aid in resolving hacks in BB code',
  	usage: `\`/compromised [UUID or username]\``,
  	database: false,
  	guildOnly: false,
  	ownerReq: false,
  	cooldown: 50,
    commandPermissions: [],
  	botChannelPermissions: [],
  	botGuildPermissions: [],
	async execute(interaction, row) {
    let readData = funcImports.readOwnerSettings();
        let api = readData.api,
            dst = readData.dst;

    let tzOffset = row ? (dst == true && row.daylightSavings == true ? row.timezone * 1 + 1: row.timezone) * 3600000 : 0;
    let tz = row ? (dst == true && row.daylightSavings == true ? row.timezone * 1 + 1: row.timezone) : 0;
    let timeString = row ? `${new Date(Date.now() + tzOffset).toLocaleTimeString('en-IN', { hour12: true })} UTC${funcImports.decimalsToUTC(tz)}` : `${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0`;

    let compromisedEmbed = new MessageEmbed()
        .setTimestamp()
        .setFooter(`${interaction.id} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');

    checkSystemLimits();
	async function checkSystemLimits() {
		try {
            let player = interaction.options.getString('player');
			if (api == false) { //Made this a owner setting so that APIs won't get spammed, also works for locking things down.
                compromisedEmbed.setColor(`#FF5555`)
                compromisedEmbed.setTitle(`API is down!`)
                compromisedEmbed.setDescription(`This command was disabled temporarily as the Hypixel API is down!`)
                console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: API Is False`);
                return await interaction.reply({ embeds: [compromisedEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
            }
            if (!/^[a-zA-Z0-9_-]{1,24}$/g.test(player) && !/^[0-9a-f]{8}(-?)[0-9a-f]{4}(-?)[1-5][0-9a-f]{3}(-?)[89AB][0-9a-f]{3}(-?)[0-9a-f]{12}$/i.test(player)) {
                compromisedEmbed.setColor(`#FF5555`);
                compromisedEmbed.setTitle(`Invalid Username or UUID!`);
                compromisedEmbed.setDescription(`The username/UUID provided is invalid! The username cannot contain invalid characters. UUIDs must match the following regex: \`/^[0-9a-f]{8}[0-9a-f]{4}[1-5][0-9a-f]{3}[89AB][0-9a-f]{3}[0-9a-f]{12}$/i\`. You can test this regex with [__this__](https://regex101.com/r/A866mm/1) site.`);
                console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Invalid Player Name/UUID`);
                return await interaction.reply({ embeds: [compromisedEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                //Testing for invalid strings that may cause a TypeError: Request path contains unescaped characters.
            }
            await interaction.deferReply({ ephemeral: true }); //In case the API requests below take more than the 3 seconds the interaction gets
			if (/^[0-9a-f]{8}(-?)[0-9a-f]{4}(-?)[1-5][0-9a-f]{3}(-?)[89AB][0-9a-f]{3}(-?)[0-9a-f]{12}$/i.test(player)) return dataRequest(player);
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
                dataRequest(response[0].id);
            })
            .catch(async (err) => {
                if (err.name === "AbortError") {
                    if (undefinedIfHasntAborted === undefined) {
                      compromisedEmbed.setColor('#FF5555');
                      compromisedEmbed.setTitle(`Connection Failed!`);
                      compromisedEmbed.setDescription('The Mojang API failed to respond, trying again..');
                      await interaction.editReply({ embeds: [compromisedEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                      return requestUUID(username, true);
                    }
                    compromisedEmbed.setColor('#AA0000');
                    compromisedEmbed.setTitle(`Abort Error!`);
                    compromisedEmbed.setDescription('The Mojang API failed to respond, and may be down. Try with a UUID if this error continues.');
                    console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Mojang Abort Error`);
                    return await interaction.editReply({ embeds: [compromisedEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                } else if (err.name === "NotFound") {
                    compromisedEmbed.setColor(`#FF5555`); compromisedEmbed.setTitle(`Player Not Found!`);
                    compromisedEmbed.setDescription(`That Minecraft username doesn't seem to exist or hasn't logged onto Hypixel.`);
                    console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Player Not Found`);
                    return await interaction.editReply({ embeds: [compromisedEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                } else {
                    return events.errorMsg(interaction, err);
                }
            });
    }

    async function dataRequest(uuid, undefinedIfHasntAborted) {
        let controller = new AbortController();
        Promise.all([
            fetchTimeout(`https://api.slothpixel.me/api/players/${uuid}/`, 2000, {
                    signal: controller.signal
                }).then(function(response) {
                  if (response.status === 404) {let newError = new Error("HTTP status " + response.status); newError.name = "NotFound"; throw newError;}
                  if (!response.ok) {throw new Error("HTTP status " + response.status);}
                  return response.json();
                }),
            fetchTimeout(`https://api.slothpixel.me/api/players/${uuid}/status`, 2000, {
                    signal: controller.signal
                }).then(function(response) {
                  if (response.status === 404) {let newError = new Error("HTTP status " + response.status); newError.name = "NotFound"; throw newError;}
                  if (!response.ok) {throw new Error("HTTP status " + response.status);}
                  return response.json();
                }),
            fetchTimeout(`https://api.slothpixel.me/api/players/${uuid}/recentGames`, 2000, {
                    signal: controller.signal
                }).then(function(response) {
                  if (response.status === 404) {let newError = new Error("HTTP status " + response.status); newError.name = "NotFound"; throw newError;}
                  if (!response.ok) {throw new Error("HTTP status " + response.status);}
                  return response.json();
                })
          ])
          .then((data) => {
            useData(data[0], data[1], data[2]);
          })
          .catch(async (err) => {
            if (err.name === "AbortError") {
                if (undefinedIfHasntAborted === undefined) {
                  compromisedEmbed.setColor('#FF5555');
                  compromisedEmbed.setTitle(`Connection Failed!`);
                  compromisedEmbed.setDescription('The Slothpixel API failed to respond, trying again..');
                  await interaction.editReply({ embeds: [compromisedEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                  return dataRequest(uuid, true);
                }
                compromisedEmbed.setColor('#AA0000');
                compromisedEmbed.setTitle(`Abort Error!`);
                compromisedEmbed.setDescription('The Slothpixel API failed to respond, and may be down. Try again later.');
                console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Slothpixel Abort Error`);
                return await interaction.editReply({ embeds: [compromisedEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
            } else if (err.name === "NotFound") {
                compromisedEmbed.setColor(`#FF5555`); 
                compromisedEmbed.setTitle(`Player Not Found!`);
                compromisedEmbed.setDescription(`That Minecraft username doesn't seem to exist or hasn't logged onto Hypixel. Setup canceled.`);
                console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Slothpixel Player Not Found`);
                return await interaction.editReply({ embeds: [compromisedEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
            } else {
                return events.errorMsg(interaction, err);
            }
        });
    }
    
    async function useData(playerData, statusData, recentGamesData) {
        let timeSinceLastLogin = `${secondsToDays(new Date() - playerData.last_login)}${new Date(new Date() - playerData.last_login).toISOString().substr(11, 8)}`;
        let timeSincefLastLogout = `${secondsToDays(new Date() - playerData.last_logout)}${new Date(new Date() - playerData.last_logout).toISOString().substr(11, 8)}`;

        let timestampOfLastLogin = funcImports.epochToCleanDate(new Date(playerData.last_login + tzOffset)) + ", " + new Date(playerData.last_login + tzOffset).toLocaleTimeString('en-IN', { hour12: true });
        let timestampOfLastLogout = funcImports.epochToCleanDate(new Date(playerData.last_logout + tzOffset)) + ", " + new Date(playerData.last_logout + tzOffset).toLocaleTimeString('en-IN', { hour12: true });

        let lastPlaytime = `${secondsToDays(playerData.last_logout - playerData.last_login)}${new Date(playerData.last_logout - playerData.last_login).toISOString().substr(11, 8)}`;

        function secondsToDays(ms) { //calculating days from seconds
            ms = ms / 1000;
            let day = Math.floor(ms / (3600 * 24));
            let days = day > 0 ? day + (day == 1 ? ' day ' : ' days ') : ''; //may be a grammar bug somewhere here
            return days;
        }


        let status = `This is a templated message with session and game stats autofilled by a Discord bot, so not everything may apply to you. Your account may have been compromised and used to cheat with. Your account's last session is below; do you recognize the data?[HR][/HR]`

        if (!statusData.online) {
            status += `[B]Basic Session Details[/B]\`[LIST][*][B]Status:[/B] Offline[*][B]UUID:[/B] ${playerData.uuid}[*][B]Last Playtime:[/B] ${playerData.last_login && playerData.last_logout ? `${lastPlaytime} long` : `Unknown`}[*][B]Last Game Played:[/B] ${playerData.last_game ? `${playerData.last_game}` : `Unknown` }[*][B]Last Login:[/B] ${playerData.last_login ? `${timestampOfLastLogin} UTC ${funcImports.decimalsToUTC(tz)}, ${timeSinceLastLogin} ago` : `Unknown` }[*][B]Last Logout:[/B] ${playerData.last_logout ? `${timestampOfLastLogout} UTC ${funcImports.decimalsToUTC(tz)}, ${timeSincefLastLogout} ago` : `Unknown` }[*][B]Language:[/B] ${playerData.language ? `${playerData.language}` : `Unknown` }[*][B]Version:[/B] ${playerData.mc_version ? `${playerData.mc_version}` : `Unknown` }[/LIST]\``;
        } else if (statusData.online) {
            status += `[B]Basic Session Details[/B]\`[LIST][*][B]Status:[/B] Online[*][B]UUID:[/B] ${playerData.uuid}[*][B]Playtime:[/B] ${playerData.last_login ? `${timeSinceLastLogin}` : `Unknown`}[*][B]Last Game Played:[/B] ${playerData.last_game ? `${playerData.last_game}` : `Unknown` }${statusData.game.type ? `[*][B] Current Game:[/B] ${statusData.game.type}` : `` }${statusData.game.mode ? `[*][B]Mode:[/B] ${statusData.game.mode}` : `` }${statusData.game.map ? `[*][B]Map:[/B] ${statusData.game.map}` : `` }[*][B]Last Login:[/B] ${playerData.last_login ? `${timestampOfLastLogin} UTC ${funcImports.decimalsToUTC(tz)}, ${timeSinceLastLogin} ago` : `Unknown` }[*][B]Last Logout:[/B] ${playerData.last_logout ? `${timestampOfLastLogout} UTC ${funcImports.decimalsToUTC(tz)}, ${timeSincefLastLogout} ago` : `Unknown` }[*][B]Language:[/B] ${playerData.language ? `${playerData.language}` : `Unknown` }[*][B]Version:[/B] ${playerData.mc_version ? `${playerData.mc_version}` : `Unknown` }\`[/LIST]`;
        }

        if (statusData.game.type || playerData.last_game) switch (statusData.game.type || playerData.last_game) {
            case 'Warlords':
                status += `[B]Your Statistics for Warlord[/B]\`[LIST][*][B]Coins:[/B] ${playerData.stats.Warlords.coins}[*][B]K/D Ratio:[/B] ${playerData.stats.Warlords.kill_death_ratio}[*][B]Wins:[/B] ${playerData.stats.Warlords.wins}[*][B]Kills:[/B] ${playerData.stats.Warlords.kills}[*][B]Deaths:[/B] ${playerData.stats.Warlords.deaths}[/LIST]\``;
              break;
            case 'Bed Wars':
            case 'BedWars':
                status += `[B]Your Statistics for BedWars[/B]\`[LIST][*][B]Level:[/B] ${playerData.stats.BedWars.level}[*][B]Coins:[/B] ${playerData.stats.BedWars.coins}[*][B]Total Games Joined:[/B] ${playerData.stats.BedWars.games_played}[*][B]Winstreak:[/B] ${playerData.stats.BedWars.winstreak}[*][B]Final K/D:[/B] ${playerData.stats.BedWars.final_k_d}[*][B]K/D:[/B] ${playerData.stats.BedWars.k_d}[/LIST]\``;
              break;
            case 'Duels':
                status += `[B]Your Statistics for Duels[/B]\`[LIST][*][B]Coins:[/B] ${playerData.stats.Duels.general.coins}[*][B]Cosmetic Count:[/B] ${playerData.stats.Duels.general.packages.length}[*][B]K/D Ratio:[/B] ${playerData.stats.Duels.general.kd_ratio}[*][B]W/L Ratio:[/B] ${playerData.stats.Duels.general.win_loss_ratio}[*][B]Wins:[/B] ${playerData.stats.Duels.general.wins}[*][B]Kills:[/B] ${playerData.stats.Duels.general.kills}[*][B]Deaths:[/B] ${playerData.stats.Duels.general.deaths}[/LIST]\``;
              break;
            case 'Blitz Survival Games':
            case 'Blitz':
                status += `[B]Your Statistics for Blitz[/B]\`[LIST][*][B]Coins:[/B] ${playerData.stats.Blitz.coins}[*][B]K/D Ratio:[/B] ${playerData.stats.Blitz.k_d}[*][B]W/L Ratio:[/B] ${playerData.stats.Blitz.win_loss}[*][B]Wins:[/B] ${playerData.stats.Blitz.wins}[*][B]Kills:[/B] ${playerData.stats.Blitz.kills}[*][B]Deaths:[/B] ${playerData.stats.Blitz.deaths}[/LIST]\``;
              break;
            case 'Pit':
                status += `[B]Your Statistics for the Pit[/B]\`[LIST][*][B]Total Gold Earned:[/B] ${playerData.stats.Pit.gold_earned}[*][B]Prestige:[/B] ${playerData.stats.Pit.prestige}[*][B]Playtime:[/B] ${playerData.stats.Pit.playtime_minutes} minutes[*][B]Best Streak:[/B] ${playerData.stats.Pit.max_streak}[*][B]Chat Messages:[/B] ${playerData.stats.Pit.chat_messages}[*][B]K/D Ratio:[/B] ${playerData.stats.Pit.kd_ratio}[*][B]Kills:[/B] ${playerData.stats.Pit.kills}[*][B]Deaths:[/B] ${playerData.stats.Pit.deaths}[/LIST]\``;
              break;
            case 'SkyWars':
                status += `[B]Your Statistics for SkyWars[/B]\`[LIST][*][B]Level:[/B] ${playerData.stats.SkyWars.level}[*][B]Coins:[/B] ${playerData.stats.SkyWars.coins}[*][B]K/D Ratio:[/B] ${playerData.stats.SkyWars.kill_death_ratio}[*][B]W/L Ratio:[/B] ${playerData.stats.SkyWars.win_loss_ratio}[*][B]Wins:[/B] ${playerData.stats.SkyWars.wins}[*][B]Kills:[/B] ${playerData.stats.SkyWars.kills}[*][B]Deaths:[/B] ${playerData.stats.SkyWars.deaths}[/LIST]\``;
              break;
            case 'Speed UHC':
            case 'SpeedUHC':
                status += `[B]Your Statistics for Speed UHC[/B]\`[LIST][*][B]Coins:[/B] ${playerData.stats.SpeedUHC.coins}[*][B]K/D Ratio:[/B] ${playerData.stats.SpeedUHC.kd}[*][B]W/L Ratio:[/B] ${playerData.stats.SpeedUHC.win_loss}[*][B]Wins:[/B] ${playerData.stats.SpeedUHC.wins}[*][B]Kills:[/B] ${playerData.stats.SpeedUHC.kills}[*][B]Deaths:[/B] ${playerData.stats.SpeedUHC.deaths}[/LIST]\``;
              break;
            case 'UHC Champions':
            case 'UHC':
                status += `[B]Your Statistics for UHC[/B]\`[LIST][*][B]Level:[/B] ${playerData.stats.UHC.level}[*][B]Coins:[/B] ${playerData.stats.UHC.coins}[*][B]K/D Ratio:[/B] ${playerData.stats.UHC.kd}[*][B]W/L Ratio:[/B] ${playerData.stats.UHC.win_loss}[*][B]Wins:[/B] ${playerData.stats.UHC.wins}[*][B]Kills:[/B] ${playerData.stats.UHC.kills}[*][B]Deaths:[/B] ${playerData.stats.UHC.deaths}[/LIST]\``;
              break;
            case 'Walls':
                status += `[B]Your Statistics for the Walls[/B]\`[LIST][*][B]Coins:[/B] ${playerData.stats.Walls.coins}[*][B]K/D Ratio:[/B] ${playerData.stats.Walls.kd}[*][B]W/L Ratio:[/B] ${playerData.stats.Walls.win_loss}[*][B]Wins:[/B] ${playerData.stats.Walls.wins}[*][B]Kills:[/B] ${playerData.stats.Walls.kills}[*][B]Deaths:[/B] ${playerData.stats.Walls.deaths}[/LIST]\``;
              break;
            case 'Mega Walls':
            case 'MegaWalls':
                status += `[B]Your Statistics for Mega Walls[/B]\`[LIST][*][B]Coins:[/B] ${playerData.stats.MegaWalls.coins}[*][B]K/D Ratio:[/B] ${playerData.stats.MegaWalls.kill_death_ratio}[*][B]W/L Ratio:[/B] ${playerData.stats.MegaWalls.win_loss_ratio}[*][B]Wins:[/B] ${playerData.stats.MegaWalls.wins}[*][B]Kills:[/B] ${playerData.stats.MegaWalls.kills}[*][B]Deaths:[/B] ${playerData.stats.MegaWalls.deaths}[/LIST]\``;
              break;
        }

        let gamesPlayedSinceLogin = 0; //Calculates the amount of games played during the session

       for (let o = 0; o < recentGamesData.length; o++) {
          if (playerData.last_login < recentGamesData[o].date && playerData.last_logout > recentGamesData[o].date) gamesPlayedSinceLogin++;
        }

        if (playerData.last_login && playerData.last_logout && playerData.last_game) status += `Your account logged in on ${timestampOfLastLogin} UTC${funcImports.decimalsToUTC(tz)}, (${timeSinceLastLogin} ago) and was online for ${lastPlaytime} before getting banned/logging out. During this time, your account played the game ${playerData.last_game}.${gamesPlayedSinceLogin > 1 && gamesPlayedSinceLogin < 100 ? ` During this session, your account played ${gamesPlayedSinceLogin} games.` : gamesPlayedSinceLogin > 100 ? ` During this session, your account played 100+ games.` : ``}${playerData.language ? ` The account's language was set to ${playerData.language}.` : ``}${playerData.mc_version ? ` The account's version was set to Minecraft version ${playerData.mc_version}.` : ``}`;

        for (let i = 0; i < 3; i++) {
          if (recentGamesData[i]) {
              status += `[SPOILER=Recent Game ${i + 1}]`;
              let header = `[B]${recentGamesData[i].gameType} | ${funcImports.epochToCleanDate(new Date(recentGamesData[i].date + tzOffset))} | UTC ${funcImports.decimalsToUTC(tz)}[/B]`;
              let bodyText = `[*]${recentGamesData[i].hasOwnProperty("date") && recentGamesData[i].date ? `Game Start: ${new Date(recentGamesData[i].date + tzOffset).toLocaleTimeString('en-IN', { hour12: true })}` : `Game Start: Unknown`}\n`;
              bodyText += `[*]${recentGamesData[i].hasOwnProperty('ended') && recentGamesData[i].ended ? `Game End: ${new Date(recentGamesData[i].ended + tzOffset).toLocaleTimeString('en-IN', { hour12: true })}` : `Game End: In progress`}\n`;
              bodyText += `[*]${recentGamesData[i].hasOwnProperty('ended') && recentGamesData[i].ended ? `Play Time: ${new Date(recentGamesData[i].ended - recentGamesData[i].date).toISOString().substr(11, 8)}\n` : `Play Time Elapsed: ${new Date(Date.now() - recentGamesData[i].date).toISOString().substr(11, 8)}\n` }`;
              bodyText += `[*]${recentGamesData[i].mode ? `Mode: ${recentGamesData[i].mode}\n` : `` }`;
              bodyText += `[*]${recentGamesData[i].map ? `Map: ${recentGamesData[i].map}` : `` }`;
              status += header;
              status += `\`[LIST]${bodyText}[/LIST]\``;
              status += `[/SPOILER]`;
          }
        }

        status += `[HR][/HR][SPOILER="Now What?"]Appeals are final. The most you can do is secure your account and wait. During this time, you should check up on your account security. Check the spoilers for more information on relevant topics.[/SPOILER]`

        status += `[SPOILER="Account Security"]Compromised accounts are often attacked again through the same vulnerability. You should change your password and enable 2FA once/if you are using a Microsoft account. All accounts should become eligible for migration during Q4 of 2021. Check out https://www.hypixel.net/security for an official guide. Here are some ways to help secure your account:\`[LIST][*]Use a strong password, never reuse them for multiple sites. Use a password manager if you have trouble keeping track of them[*]Change your passwords regularly[*]Trust absolutely noone with your credentials[*]Be cautious of phishing attacks. No corporation will [B]EVER[/B] ask for your password. Common sense is your friend[*][URL=https://imgur.com/a/FzoUjro][U]Don't give out logs/crash logs without ensuring that session IDs are scrubbed (These were removed from crash logs after version 1.9.1)[/U][/URL][*]Use security questions that can't be brute-forced, eg: don't use "What is your favorite movie", as there are only a few hundred/thousand possibilities[*]Set up [URL=https://hypixel.net/argus/][U]Argus[/U], which alerts you on logins from unusual IPs[/URL][/LIST]\`[/SPOILER]`;

        compromisedEmbed.setColor('#7289DA');
        compromisedEmbed.setTitle(`Status of ${playerData.username}`);
        compromisedEmbed.setDescription(status);
        compromisedEmbed.addField(`[SPOILER="Appealing a ban for cheating"]`, `If you haven't already, you should appeal at https://hypixel.net/threads/punishment-information-and-how-to-appeal.3261027/. If cheats were used on your account, either by you or another individual, you will likely not be unbanned. Appeals are for the innocent only. You will not be told what Watchdog check/modification got you banned, as reducing advantages for cheat developers is better for Hypixel, even at the cost of transparency. If your appeal is/was denied, you will not be unbanned early. [URL=https://hypixel.net/threads/is-it-possible-to-appeal-for-the-same-ban-twice.2083286/#post-15525155][U]You can not appeal again.[/U][/URL] Appeal responses are not botted; they use templated copy-paste responses. Contact [URL=https://support.hypixel.net][U]Hypixel Support[/U][/URL] for any other issues with appealing or message a staff member.[/SPOILER]`);
        compromisedEmbed.addField(`[SPOILER="Your account, your responsibility"]`, `Hypixel has a "Your account, your responsibility" policy because they are a third party server; they don't have access to data like transaction IDs, security questions, system information (eg: Hardware information, Java version, OS build, other diagnostic info), every login Unix timestamp, every connection with Mojang's servers, every session ID, timezone, etc. Hypixel only gets your IP and some surface-level client data. Evidence is easily faked, and as said above, Hypixel lacks verifiable data to verify if it was you or someone else. [URL=https://hypixel.net/threads/you-should-take-responsibility-for-your-accounts-safety.4446126/post-32187788][U]It is for that reason that Hypixel does not take evidence of you being hacked, or evidence that you were hacked.[/U][/URL][/SPOILER]`);
        compromisedEmbed.addField(`[SPOILER="Appealing a security ban"]`, `Appeals for these bans will almost always be accepted. Appeal at https://hypixel.net/threads/punishment-information-and-how-to-appeal.3261027/. If/when your appeal is accepted, your account will enter a 30-day recovery period where you can contact Mojang support to change emails and secure your account. This recovery period is not skippable. You will have to wait it out. As for VPNs, VPNs are not recommended. They have been known to false ban users, likely because many users join on a singular IP; someone joining on an IP where someone has already gotten banned is suspicious.[/SPOILER]`);

        await interaction.editReply({ embeds: [compromisedEmbed], ephemeral: true }).then(async () => {
          if (!statusData.online && (playerData.last_logout < playerData.last_login) ||
              !playerData.last_login ||
              !playerData.last_logout) await interaction.followUp({ content: '> There may be some sort of API limitation which hides some information about this player.', ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
        }).catch((err) => {return events.errorMsg(interaction, err)});
    }
  },
};