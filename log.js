const { MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu, Permissions } = require('discord.js');
const fs = require('fs');

const events = require('./events.js');
const funcImports = require('./functions.js');
const database = require('./database.js');
const userConfig = require('./userConfig.json');
const botOwner = userConfig["BotOwnerID"];
const prefix = userConfig["prefix"];
const cnsle = userConfig["consoleID"];
const logInterval = userConfig["logInterval"];
const hypixelAPIkey = userConfig["hypixelAPIkey"];

const controller = new AbortController();
const fetch = require('node-fetch');
const fetchTimeout = (url, ms, { signal, ...options } = {}) => { //obviously not designed by me lol
const controller = new AbortController();
const promise = fetch(url, { signal: controller.signal, ...options });
if (signal) signal.addEventListener("abort", () => controller.abort());
const timeout = setTimeout(() => controller.abort(), ms);
return promise.finally(() => clearTimeout(timeout));
};

async function loadBalancer(client) {
    let readData = funcImports.readOwnerSettings();
    let api = readData.api,
    dst = readData.dst;

    if (api === false) return client.user.setActivity(`an API problem, be right back! | /help`, {type: 'WATCHING'});

    let table = await database.getTable('users');
    let loadedUsers = 0;

    let timer = ms => new Promise(res => setTimeout(res, ms))

    for (let i = 0; i < table.length; i++) {
      if (table[i].log == 0) continue;
      loadedUsers++
    }

    client.user.setPresence({ activities: [{ name: `${loadedUsers === 1 ? `${loadedUsers} account` : `${loadedUsers} accounts`} | /help /setup | ${client.guilds.cache.size} ${client.guilds.cache.size === 1 ? 'server' : 'servers'}`, type: `WATCHING` }], status: 'dnd' });

    for (let i = 0; i < table.length; i++) {
      if (table[i].log == 0) continue;
        
        checkIfServerExists(table[i], client, i, dst);
        await timer(`${loadedUsers < 1 ? `${1000}` : `${logInterval / loadedUsers * 1000}`}`); //calculates the ms between each loading to balance the load across the 30 seconds. the most anyone will shift is 15 seconds with 1 new log user.
    }
}

async function checkIfServerExists(dbUserData, client, userNumber, dst) {
  let guild = await client.guilds.cache.get(`${dbUserData.guildID}`)
  if (!guild) funcImports.deleteUserData(dbUserData, client, ``);
  checkAlertChannel(dbUserData, client, userNumber, dst)
};

async function checkAlertChannel(dbUserData, client, userNumber, dst) {
  let alerts = client.channels.cache.get(`${dbUserData.alertID}`);
  if (!alerts) return funcImports.deleteUserData(dbUserData, client, `Missing alerts channel`);

  let channelPermissions = await alerts.permissionsFor(alerts.guild.me).toArray();
  let missingAlertPermissions = [];
  let requiredAlertPermissions = ["VIEW_CHANNEL","SEND_MESSAGES","EMBED_LINKS"];
  requiredAlertPermissions.forEach(permission => {if (!channelPermissions.includes(permission)) missingAlertPermissions.push(permission)});

  if (missingAlertPermissions.length === 0) return checkLogChannel(dbUserData, client, userNumber, dst, alerts);
  if (missingAlertPermissions.includes('SEND_MESSAGES')) {
    return console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | ${dbUserData.discordID} | ${dbUserData.discordUsername} is missing ${missingAlertPermissions.join(', ')} in the alert channel.`);
  } else {
    console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | ${dbUserData.discordID} | ${dbUserData.discordUsername} is missing ${missingAlertPermissions.join(', ')} in the alert channel.`);
    return alerts.send(`This bot is missing the following permissions(s) in the alert channel: ${missingAlertPermissions.join(", ")}. If the bot's roles appear to have all of these permissions, check the channel's advanced permissions. The bot cannot monitor your account. You can turn monitoring off temporarily with \`/monitor\` which in turn stops these alerts.`);
  }
};

async function checkLogChannel(dbUserData, client, userNumber, dst, alerts) {
  let logs = client.channels.cache.get(`${dbUserData.logID}`);
  if (!logs) return funcImports.deleteUserData(dbUserData, client, `Missing logs channel`);

  let channelPermissions = await logs.permissionsFor(logs.guild.me).toArray();
  let missingLogPermissions = [];
  let requiredLogPermissions = ["VIEW_CHANNEL","SEND_MESSAGES","EMBED_LINKS"];
  requiredLogPermissions.forEach(permission => {if (!channelPermissions.includes(permission)) missingLogPermissions.push(permission)});

  if (missingLogPermissions.length === 0) return apiCall(dbUserData, client, userNumber, dst, alerts, logs);
  console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | ${dbUserData.discordID} | ${dbUserData.discordUsername} is missing ${missingLogPermissions.join(', ')} in the log channel.`);
  return alerts.send(`This bot is missing the following permissions(s) in the log channel: ${missingLogPermissions.join(", ")}. If the bot's roles appear to have all of these permissions, check the channel's advanced permissions. The bot cannot monitor your account. You can turn monitoring off temporarily with \`/monitor\` which in turn stops these alerts.`);
};

function apiCall(dbUserData, client, userNumber, dst, alerts, logs) {
  Promise.all([
    fetchTimeout(`https://api.hypixel.net/player?uuid=${dbUserData.minecraftUUID}&key=${hypixelAPIkey}`, 1500, {
        signal: controller.signal
      }).then(function(response) {
        if (response.status === 429) {let newError = new Error("HTTP status " + response.status); newError.name = "LimitError"; throw newError;}
        if (!response.ok) {throw new Error("HTTP status " + response.status);}
        return response.json();
      }),
    fetchTimeout(`https://api.hypixel.net/status?uuid=${dbUserData.minecraftUUID}&key=${hypixelAPIkey}`, 1500, {
        signal: controller.signal
      }).then(function(response) {
        if (response.status === 429) {let newError = new Error("HTTP status " + response.status); newError.name = "LimitError"; throw newError;}
        if (!response.ok) {throw new Error("HTTP status " + response.status);}
        return response.json();
      })
  ])
    .then((apiData) => {
        return accountChecks(apiData[0], apiData[1], dbUserData, client, userNumber, dst, alerts, logs); //backup check to ensure success
    })
    .catch((err) => {
      if (err.name === "AbortError") {
        events.logErrorMsg(client, userNumber, err, `Hypixel Abort Error`, cnsle, false, false);
      } else {
        events.logErrorMsg(client, userNumber, err, `Likely a 502 or 429`, cnsle, true, false);
      }
    });  
};

async function accountChecks(playerData, statusData, dbUserData, client, userNumber, dst, alerts, logs) {
  try {
    let userAlerts = dbUserData.alerts.split(" "); //0 = blacklist, 1 = whitelist, 2 = language, 3 = session, 4 = offline, 5 = version
  
    let tzOffset = ((dbUserData.daylightSavings == true && dst == true ? dbUserData.timezone * 1 + 1: dbUserData.timezone) * 3600000);
    let tz =  dst == true && dbUserData.daylightSavings == true ? dbUserData.timezone * 1 + 1: dbUserData.timezone;
    let timeString = new Date(Date.now() + tzOffset).toLocaleTimeString('en-IN', { hour12: true }) + " UTC" + funcImports.decimalsToUTC(tz); 
  
    let timeSinceLastLogin = `${secondsToDays(new Date() - playerData.player.lastLogin)}${new Date(new Date() - playerData.player.lastLogin).toISOString().substr(11, 8)}`
    let ceilRoundedLastLogin = Math.ceil((new Date() - playerData.player.lastLogin) / 1000)
  
    let timeSincefLastLogout = `${secondsToDays(new Date() - playerData.player.lastLogout)}${new Date(new Date() - playerData.player.lastLogout).toISOString().substr(11, 8)}`
    let ceilRoundedLastLogout = Math.ceil((new Date() - playerData.player.lastLogout) / 1000)
  
    let timestampOfLastLogin = funcImports.epochToCleanDate(new Date(playerData.player.lastLogin + tzOffset)) + ", " + new Date(playerData.player.lastLogin + tzOffset).toLocaleTimeString('en-IN', { hour12: true }) + " UTC" + funcImports.decimalsToUTC(tz);
    let timestampOfLastLogout = funcImports.epochToCleanDate(new Date(playerData.player.lastLogout + tzOffset)) + ", " + new Date(playerData.player.lastLogout + tzOffset).toLocaleTimeString('en-IN', { hour12: true })  + " UTC" + funcImports.decimalsToUTC(tz);
  
    let lastPlaytime = `${secondsToDays(playerData.player.lastLogout - playerData.player.lastLogin)}${new Date(playerData.player.lastLogout - playerData.player.lastLogin).toISOString().substr(11, 8)}`
    let relogEventTime = (playerData.player.lastLogin - playerData.player.lastLogout) / 1000;
    let roundedRelogTime = Math.round(relogEventTime * 100) / 100;

    let advancedSettings = dbUserData.advanced ? dbUserData.advanced.split(" ") : [];
    let userVersions = dbUserData.version ? dbUserData.version.split(" ") : [];

    let userBlacklistedGames = dbUserData.blacklist ? dbUserData.blacklist.split(" ") : [];
    let blacklistAlertBoolean = userBlacklistedGames.length > 0 && statusData.session.gameType ? userBlacklistedGames.indexOf(statusData.session.gameType.toUpperCase()) >= 0 : false;
    //Variable will be 1/true if the game they are playing is blacklisted

    let userWhitelistedGames = dbUserData.whitelist ? dbUserData.whitelist.split(" ").push("LIMBO", "MAIN", "REPLAY", "TOURNAMENT", "PROTOTYPE", "LEGACY") : [];
    let whitelistAlertBoolean = userWhitelistedGames.length > 0 && statusData.session.gameType ? userWhitelistedGames.indexOf(statusData.session.gameType.toUpperCase()) === -1 &&  statusData.session.mode !== 'LOBBY' && blacklistAlertBoolean === false : false;
    //Variable will be 1/true if the game they are playing is not whitelisted & they have items in their whitelist
  
  function secondsToDays(ms) { //calculating days from seconds
    ms = ms / 1000
    let day = Math.floor(ms / (3600 * 24));
    let days = day > 0 ? day + (day == 1 ? ' day ' : ' days ') : ''; //may be a grammar bug somewhere here
    return days;
  };
  
  function loginTimeFunc() {
    let loginTime = dbUserData.offline.split(" ");
    let loginTimep1 = loginTime[0] * 1
    let loginTimep2 = loginTime[1] * 1
    let timeLastLogin = (new Date(playerData.player.lastLogin + tzOffset).getHours()) + ((new Date(playerData.player.lastLogin + tzOffset).getMinutes()) / 60); 
  
    if (loginTimep1 < loginTimep2) {
      if (timeLastLogin >= loginTimep1 && timeLastLogin <= loginTimep2) return true;
      return false;
    } else if (loginTimep1 > loginTimep2) {
      if (timeLastLogin >= loginTimep1 || timeLastLogin <= loginTimep2) return true;
      return false;
    } else {
      return false;
    }
  };

  let blacklistAlert = statusData.session.online ? blacklistAlertBoolean : false,
    whitelistAlert = statusData.session.online ? whitelistAlertBoolean : false,
    languageAlert = statusData.session.online ? playerData.player.userLanguage && dbUserData.language !== playerData.player.userLanguage : false,
    relogAlert = dbUserData.loginMS !== playerData.player.lastLogin && (relogEventTime < 10 && relogEventTime > 0),
    logoutAlert = dbUserData.logoutMS !== playerData.player.lastLogout,
    loginAlert = dbUserData.loginMS !== playerData.player.lastLogin,
    loginTimeAlert = statusData.session.online ? loginTimeFunc() : false,
    versionAlert = statusData.session.online ? playerData.player.mcVersionRp && !userVersions.includes(playerData.player.mcVersionRp) : false;

  let isAlert = blacklistAlert || whitelistAlert || languageAlert || relogAlert || logoutAlert || loginAlert || loginTimeAlert || versionAlert;

  let embedColor = !statusData.session.online ? `#555555` 
    : blacklistAlert || languageAlert ? `#FF5555`
    : whitelistAlert || loginTimeAlert || relogAlert || versionAlert ? `#FFAA00`
    : `#00AA00`

  if (logoutAlert) {
    try {
      await database.changeData(dbUserData.discordID, `UPDATE users SET logoutMS = ? WHERE discordID = ?`, playerData.player.lastLogout);
    } catch (err) {
      events.logErrorMsg(client, userNumber, err, `Failed to write a new logout. Database is likely locked`, cnsle, true, true);
    }
  }

  if (loginAlert) {
    try {
      await database.changeData(dbUserData.discordID, `UPDATE users SET loginMS = ? WHERE discordID = ?`, playerData.player.lastLogin);
    } catch (err) {
      events.logErrorMsg(client, userNumber, err, `Failed to write a new login. Database is likely locked`, cnsle, true, true);
    }
  }
      
  if (isAlert) {
    let alertEmbed = new MessageEmbed()
      .setColor(embedColor)
      .setTimestamp()
      .setFooter(`Alert at ${timeString}`, 'http://www.pngall.com/wp-content/uploads/2017/05/Alert-Download-PNG.png');

    if (embedColor !== '#00AA00') alertEmbed.addField('Quick References', '[Account Login Portal](https://www.minecraft.net/en-us/login) - [Microsoft Account Reset](https://account.live.com/password/reset) - [Account Security Guide](https://support.hypixel.net/hc/en-us/articles/360019538060-Account-Security-Guide)')

    if (blacklistAlert && userAlerts[0]) {
      alertEmbed.setTitle(`Blacklisted Game Alert!`);
      alertEmbed.setDescription(`Your account was detected playing a blacklisted game: **${statusData.session.gameType}**. You can update your blacklisted games with /whitelist add/remove <gametype>`);
      alerts.send({ content: `<@${dbUserData.discordID}>`, embeds: [alertEmbed] }).catch((err) => {return events.logErrorMsg(client, userNumber, err, `Failed to send an alert`, cnsle, true, false)});
    }
    if (whitelistAlert && userAlerts[1]) {
      alertEmbed.setTitle(`Non-Whitelisted Game Alert!`);
      alertEmbed.setDescription(`Your account was detected playing a game that isn't whitelisted: **${statusData.session.gameType}**. You can update your whitelisted games with /whitelist add/remove <gametype>`);
      alerts.send({ content: `<@${dbUserData.discordID}>`, embeds: [alertEmbed] }).catch((err) => {return events.logErrorMsg(client, userNumber, err, `Failed to send an alert`, cnsle, true, false)});
    }
    if (languageAlert && userAlerts[2]) {
      alertEmbed.setTitle(`Language Alert!`);
      alertEmbed.setDescription(`Your account was detected using an unexpected language: **${playerData.player.userLanguage}**. You can update your set language with /language <language>`);
      alerts.send({ content: `<@${dbUserData.discordID}>`, embeds: [alertEmbed] }).catch((err) => {return events.logErrorMsg(client, userNumber, err, `Failed to send an alert`, cnsle, true, false)});
    }
    if (relogAlert && ceilRoundedLastLogin <= logInterval * 2 && userAlerts[3]) {
      alertEmbed.setTitle(`Session Alert!`);
      alertEmbed.setDescription(`Your account relogged for ${roundedRelogTime} seconds after logging out at ${timestampOfLastLogout}, or ${timeSincefLastLogout}, and then logging back in at ${timestampOfLastLogin}, or ${timeSinceLastLogin}. You can update your session alerts with /alerts <login/logout/relog>`);
      alerts.send({ content: `<@${dbUserData.discordID}>`, embeds: [alertEmbed] }).catch((err) => {return events.logErrorMsg(client, userNumber, err, `Failed to send an alert`, cnsle, true, false)});
    }
    if (logoutAlert && ceilRoundedLastLogout <= logInterval * 2 && !relogAlert && userAlerts[3]) {
      alertEmbed.setTitle(`Session Alert!`);
      alertEmbed.setDescription(`Your account logged out at ${timestampOfLastLogout} or ${timeSincefLastLogout} ago. Playtime was ${lastPlaytime}. You can update your session alerts with /alerts <login/logout/relog>`);
      alerts.send({ content: `<@${dbUserData.discordID}>`, embeds: [alertEmbed] }).catch((err) => {return events.logErrorMsg(client, userNumber, err, `Failed to send an alert`, cnsle, true, false)});
    }
    if (loginAlert && ceilRoundedLastLogin <= logInterval * 2 && !relogAlert && userAlerts[3]) {
      alertEmbed.setTitle(`Session Alert!`);
      alertEmbed.setDescription(`Your account logged in at ${timestampOfLastLogin} or ${timeSinceLastLogin} ago. You can update your session alerts with /alerts <login/logout/relog>`);
      alerts.send({ content: `<@${dbUserData.discordID}>`, embeds: [alertEmbed] }).catch((err) => {return events.logErrorMsg(client, userNumber, err, `Failed to send an alert`, cnsle, true, false)});
    }
    if (whitelistAlert && userAlerts[4] && advancedSettings.includes("LOGINTIME") && dbUserData.loginMS == data[0].player.lastLogin) { //Will only  active if the user has selected the advanced option to do so. Last constraint is to make sure I don't double alerts, as an alert is send on login.
      alertEmbed.setTitle(`Login Time Alert!`);
      alertEmbed.setDescription(`Your account was detected logging in at an unexpected time: **${timestampOfLastLogin}** or **${timeSinceLastLogin}** ago. You can update your online/offline time with /offlinetime`);
      alerts.send({ content: `<@${dbUserData.discordID}>`, embeds: [alertEmbed] }).catch((err) => {return events.logErrorMsg(client, userNumber, err, `Failed to send an alert`, cnsle, true, false)});
    }
    if (versionAlert && userAlerts[5]) {
      alertEmbed.setTitle(`Minecraft Version Alert!`);
      alertEmbed.setDescription(`Your account was detected using an unexpected Minecraft version: **${playerData.player.mcVersionRp}**. You can update your whitelisted version(s) of Minecraft with /version add/remove <version>`);
      alerts.send({ content: `<@${dbUserData.discordID}>`, embeds: [alertEmbed] }).catch((err) => {return events.logErrorMsg(client, userNumber, err, `Failed to send an alert`, cnsle, true, false)});
    }
  }
  
  let logEmbed = new MessageEmbed()
    .setColor(embedColor)
    .setTitle(relogAlert ? '**Relog Detected!**' : logoutAlert ? '**Logout Detected!**' : loginAlert ? '**Login Detected!**' : !statusData.session.online ? '**Offline**' : isAlert ? '**Unusual Activity Detected!**' : '**Nothing Abnormal Detected!**')
    .setTimestamp()
    .setFooter(isAlert ? `Alert at ${timeString}` : `Log at ${timeString}`, isAlert ? 'http://www.pngall.com/wp-content/uploads/2017/05/Alert-Download-PNG.png' : 'https://i.imgur.com/MTClkTu.png')
    .addField(`Status`, `${playerData.player.displayname} is ${statusData.session.online ? 'online' : 'offline'}`)
    .addField(`UUID`, playerData.player.uuid);
  if (!statusData.session.online) {
      logEmbed.addFields(
      { name: 'Last Session', value: `${playerData.player.lastLogin && playerData.player.lastLogin < playerData.player.lastLogout ? `Last Playtime: ${lastPlaytime} long` : `Playtime: Unknown`}\n${playerData.player.mostRecentGameType ? `Last Gametype: ${playerData.player.mostRecentGameType}` : `Last Gametype: Unknown` }` },);
    } else {
      logEmbed.addFields(
      { name: 'Session', value: `${playerData.player.lastLogin ? `Playtime: ${timeSinceLastLogin}` : `Playtime: Unknown`}\n${statusData.session.gameType ? `Game: ${statusData.session.gameType}\n` : `` }${statusData.session.mode ? `Mode: ${statusData.session.mode}\n` : `` }${statusData.session.map ? `Map: ${statusData.session.map}` : `` }${!statusData.session.gameType && !statusData.session.mode && !statusData.session.map ? `Data not available: Limited API!` : `` }` });
  }
    logEmbed.addField('Last Login', playerData.player.lastLogin ? `${timestampOfLastLogin}\n${timeSinceLastLogin} ago` : `Unknown`);
    logEmbed.addField('Last Logout', playerData.player.lastLogout ? `${timestampOfLastLogout}\n${timeSincefLastLogout} ago` : `Unknown`);
    logEmbed.addField('Settings', `${playerData.player.userLanguage ? `Language: ${playerData.player.userLanguage}` : `Language: Unknown`}\n${playerData.player.mcVersionRp ? `Version: ${playerData.player.mcVersionRp}` : `Version: Unknown`}`);

    if (!statusData.session.online && playerData.player.lastLogout < playerData.player.lastLogin * 1) logEmbed.addField(`**API Limitation**`, `The Online Status API must be on\nfor Gametype users and alerts to \nfunction. Please turn it on.`);
    if (languageAlert) logEmbed.addField(`**Unusual Language**`, `**${playerData.player.userLanguage}**`, true);
    if (loginTimeAlert) logEmbed.addField(`**Unusual Login Time**`, `**${timestampOfLastLogin}\n${timeSinceLastLogin}**`, true);
    if (blacklistAlert || whitelistAlert) logEmbed.addField(`**Unusual Game Type**`, `**${statusData.session.gameType}**`, true);
    if (versionAlert) logEmbed.addField(`**Unusual Version**`, `**${playerData.player.mcVersionRp}**`, true);
  await logs.send({ embeds: [logEmbed] }).catch((err) => {return events.logErrorMsg(client, userNumber, err, `Failed to send a log`, cnsle, true, false)});
  
  } catch (error) {
    let timeString = new Date(Date.now() + ((dbUserData.daylightSavings == true && dst == true ? dbUserData.timezone * 1 + 1: dbUserData.timezone) * 3600000)).toLocaleTimeString('en-IN', { hour12: true }) + " UTC" + funcImports.decimalsToUTC(dbUserData.timezone); 
    let genericLogError = new MessageEmbed()
      .setColor('#AA0000')
      .setTitle('Logging Error')
      .setTimestamp()
      .setFooter(`Logging Error at ${timeString}`, 'http://www.pngall.com/wp-content/uploads/2017/05/Alert-Download-PNG.png')
      .setDescription(`This error is expected to happen occasionally. Please report this to the bot owner if this continues.`);
    events.logErrorMsg(client, userNumber, error, `Failed to execute a log`, cnsle, true, false);
    logs.send({ embeds: [genericLogError] }).catch((err) => {return events.logErrorMsg(client, userNumber, err, `Failed to execute a log. Medium priority error`, cnsle, true, true)});
  }
};

module.exports = { loadBalancer };