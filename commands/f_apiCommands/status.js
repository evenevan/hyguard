const fs = require('fs');
const Discord = require('discord.js');
const userConfig = require('../../userConfig.json');
const hypixelAPIkey = userConfig["hypixelAPIkey"];
const prefix = userConfig["prefix"];
const funcImports = require( __dirname + '../../../functions'); //change it to only display one type that shows everything
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
  title: 'Shows the status of any player',
	description: 'Displays detailed information about a player\'s status. This includes useful data like their current gamemode, language, version, playtime, etc. As this command uses the Slothpixel API over the Hypixel API, the data is slightly delayed and may not be accurate.',
  usage: `\`${prefix}status <username>\``,
  args: true,
  database: false,
  cooldown: 7.5,
  permissions: ["VIEW_CHANNEL","SEND_MESSAGES","EMBED_LINKS","READ_MESSAGE_HISTORY"],
	execute(message, args, client, row) {
    if (row !== undefined) {
      var tzOffset = (row.timezone * 3600000);
      var tz = row.timezone
      var timeString = new Date(Date.now() + tzOffset).toLocaleTimeString('en-IN', { hour12: true });
      var dateString = funcImports.epochToCleanDate(new Date(Date.now() + tzOffset));
  } else {
      var tzOffset = 0
      var tz = 0
      var timeString = `${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC`
      var dateString = funcImports.epochToCleanDate(new Date());
  }
  
  try {
      message.channel.send('Loading..').then(async msg => {
          const controller = new AbortController();
  
          const readData = funcImports.readOwnerSettings();
          const api = readData.api;
  
          if (api == false) {
              msg.delete();
              return message.channel.send(`${message.author}, this command is temporarily disabled as the API is down!`);
          }
  
          if (!/^[\w+]{1,16}$/gm.test(args[0])) {
              msg.delete();
              return message.channel.send(`${message.author}, that doesn't seem to be a valid Minecraft username!`);
          }
  
          function decimalsToUTC(decimal) {
              if (/\./.test(decimal)) {
                  let decimalArray = decimal.toString().split(".")
                  let hour = decimalArray[0] * 1
                  let minutes = Math.round((`0.${(decimalArray[1])}`) * 60)
                  if (hour < 0) return hour + ":" + (minutes * 1).toFixed(2).slice(0, -3)
                  return "+" + hour + ":" + (minutes * 1).toFixed(2).slice(0, -3)
              } else {
                  if (decimal < 0) return decimal
                  return "+" + decimal
              }
          };

          mojangAPIGetUUID();

          function mojangAPIGetUUID() {
  
            fetchTimeout(`https://api.mojang.com/users/profiles/minecraft/${args[0]}`, 5000, {
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
                    slothpixel(response.id);
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

        function slothpixel(uuid) {
            Promise.all([
                fetchTimeout(`https://api.slothpixel.me/api/players/${uuid}/`, 2000, {
                    signal: controller.signal
                }).then(function(response) {
                  if (!response.ok) {throw new Error("HTTP status " + response.status);}
                  return response.json();
                }),
                fetchTimeout(`https://api.slothpixel.me/api/players/${args[0]}/status`, 2000, {
                    signal: controller.signal
                }).then(function(response) {
                  if (!response.ok) {throw new Error("HTTP status " + response.status);}
                  return response.json();
                })
            ])
            .then((player) => {

                let timeSinceLastLogin = `${secondsToDays(new Date() - player[0].last_login)}${new Date(new Date() - player[0].last_login).toISOString().substr(11, 8)}`;
                let timeSincefLastLogout = `${secondsToDays(new Date() - player[0].last_logout)}${new Date(new Date() - player[0].last_logout).toISOString().substr(11, 8)}`;

                let timestampOfLastLogin = funcImports.epochToCleanDate(new Date(player[0].last_login + tzOffset)) + ", " + new Date(player[0].last_login + tzOffset).toLocaleTimeString('en-IN', { hour12: true });
                let timestampOfLastLogout = funcImports.epochToCleanDate(new Date(player[0].last_logout + tzOffset)) + ", " + new Date(player[0].last_logout + tzOffset).toLocaleTimeString('en-IN', { hour12: true });

                let lastPlaytime = `${secondsToDays(player[0].last_logout - player[0].last_login)}${new Date(player[0].last_logout - player[0].last_login).toISOString().substr(11, 8)}`;

                function secondsToDays(ms) { //calculating days from seconds
                    ms = ms / 1000
                    let day = Math.floor(ms / (3600 * 24));
                    let days = day > 0 ? day + (day == 1 ? ' day ' : ' days ') : ''; //may be a grammar bug somewhere here
                    return days;
                };

                let embed = new Discord.MessageEmbed()
                    .setColor('#7289DA')
                    .setTitle(`Status of ${player[0].username}`)
                    .setDescription(`Data is not quite real-time, and some fields may be inaccurate. Gathered with the Slothpixel API.`)
                    .setFooter(`Executed at ${dateString} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');
                if (!player[1].online) {
                    embed.addFields({ name: 'Status', value: `${player[0].username} is offline` }, { name: 'UUID', value: `${player[0].uuid}` }, { name: 'Last Session', value: `${player[0].last_login ? `Last Playtime: ${lastPlaytime} long` : `Playtime: Unknown`}\n${player[0].last_game ? `Last Gametype: ${player[0].last_game}` : `Last Gametype: Unknown` }` }, { name: 'Last Login', value: `${player[0].last_login ? `${timestampOfLastLogin} UTC ${decimalsToUTC(tz)}\n${timeSinceLastLogin} ago` : `Unknown` }` }, { name: 'Last Logout', value: `${player[0].last_logout ? `${timestampOfLastLogout} UTC ${decimalsToUTC(tz)}\n${timeSincefLastLogout} ago` : `Unknown` }` }, { name: 'Settings', value: `${player[0].language ? `Language: ${player[0].language}` : `Language: Unknown` }\n${player[0].mc_version ? `Version: ${player[0].mc_version}` : `Version: Unknown` }` });
                    if (!player[1].online && (player[0].last_logout < player[0].last_login * 1)) embed.addField(`**API Limitation**`, `There is a possible API limitation which hides some information.`);
                } else if (player[1].online) {
                    embed.addFields({ name: 'Status', value: `${player[0].username} is online` }, { name: 'UUID', value: `${player[0].uuid}` }, { name: 'Session', value: `${player[0].last_login ? `Playtime: ${timeSinceLastLogin}` : `Playtime: Unknown`}\n${player[1].game.type ? `Game: ${player[1].game.type}\n` : `` }${player[1].game.mode ? `Mode: ${player[1].game.mode}\n` : `` }${player[1].game.map ? `Map: ${player[1].game.map}` : `` }${!player[1].game.type && !player[1].game.mode && !player[1].game.map ? `Data not available: Limited API!` : `` }` }, { name: 'Last Login', value: `${player[0].last_login ? `${timestampOfLastLogin} UTC ${decimalsToUTC(tz)}\n${timeSinceLastLogin} ago` : `Last Login: Unknown`}` }, { name: 'Last Logout', value: `${player[0].last_logout ? `${timestampOfLastLogout} UTC ${decimalsToUTC(tz)}\n${timeSincefLastLogout} ago` : `Last Logout: Unknown`}` }, { name: 'Settings', value: `${player[0].language ? `Language: ${player[0].language}` : `Language: Unknown` }\n${player[0].mc_version ? `Version: ${player[0].mc_version}` : `Version: Unknown` }` });
                }
                msg.delete();
                message.reply(embed);

            })
            .catch((err) => {
                if (err.name === "AbortError") {
                    message.channel.send(`Slothpixel API failed, changing to Hypixel API.`);
                    hypixelAPICall();
                } else {
                    msg.delete();
                    console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | Slothpixel API Error 9: ${err}`);
                    message.channel.send(`${message.author}, Slothpixel API Error: An error occured while executing this command. \`${err}\``);
                }
            });  
        }; 
  
              function hypixelAPICall(uuid) {
                  Promise.all([
                          fetchTimeout(`https://api.hypixel.net/player?uuid=${uuid}&key=${hypixelAPIkey}`, 2000, {
                              signal: controller.signal
                          }).then(function(response) {
                            if (!response.ok) {throw new Error("HTTP status " + response.status);}
                            return response.json();
                          }),
                          fetchTimeout(`https://api.hypixel.net/status?uuid=${uuid}&key=${hypixelAPIkey}`, 2000, {
                              signal: controller.signal
                          }).then(function(response) {
                            if (!response.ok) {throw new Error("HTTP status " + response.status);}
                            return response.json();
                          })
                      ])
                      .then((data) => {
                          let timeSinceLastLogin = `${secondsToDays(new Date() - data[0].player.lastLogin)}${new Date(new Date() - data[0].player.lastLogin).toISOString().substr(11, 8)}`
  
                          let timeSincefLastLogout = `${secondsToDays(new Date() - data[0].player.lastLogout)}${new Date(new Date() - data[0].player.lastLogout).toISOString().substr(11, 8)}`
  
                          let timestampOfLastLogin = funcImports.epochToCleanDate(new Date(data[0].player.lastLogin + tzOffset)) + ", " + new Date(data[0].player.lastLogin + tzOffset).toLocaleTimeString('en-IN', { hour12: true });
                          let timestampOfLastLogout = funcImports.epochToCleanDate(new Date(data[0].player.lastLogout + tzOffset)) + ", " + new Date(data[0].player.lastLogout + tzOffset).toLocaleTimeString('en-IN', { hour12: true });
  
                          let lastPlaytime = `${secondsToDays(data[0].player.lastLogout - data[0].player.lastLogin)}${new Date(data[0].player.lastLogout - data[0].player.lastLogin).toISOString().substr(11, 8)}`
  
  
                          function secondsToDays(ms) { //calculating days from seconds
                              ms = ms / 1000
                              let day = Math.floor(ms / (3600 * 24));
                              let days = day > 0 ? day + (day == 1 ? ' day ' : ' days ') : ''; //may be a grammar bug somewhere here
                              return days;
                          };
  
                          let embed = new Discord.MessageEmbed()
                              .setColor('#7289DA')
                              .setTitle(`Status of ${data[0].player.displayname}`)
                              .setDescription(`Data is not quite real-time, and some fields may be inaccurate. This data was gathered with the Hypixel API as the Slothpixel API did not respond.`)
                              .setFooter(`Executed at ${dateString} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');
                          if (!data[1].session.online) {
                              embed.addFields({ name: 'Status', value: `${data[0].player.displayname} is offline` }, { name: 'UUID', value: `${data[0].player.uuid}` }, { name: 'Last Session', value: `${data[0].player.lastLogin && data[0].player.lastLogin < data[0].player.lastLogout ? `Last Playtime: ${lastPlaytime} long` : `Playtime: Unknown`}\n${data[0].player.mostRecentGameType ? `Last Gametype: ${data[0].player.mostRecentGameType}` : `Last Gametype: Unknown` }` }, { name: 'Last Login', value: `${data[0].player.lastLogin ? `${timestampOfLastLogin} UTC ${decimalsToUTC(`${tz}`)}\n${timeSinceLastLogin} ago` : `Unknown` }` }, { name: 'Last Logout', value: `${data[0].player.lastLogout ? `${timestampOfLastLogout} UTC ${decimalsToUTC(`${tz}`)}\n${timeSincefLastLogout} ago` : `Unknown` }` }, { name: 'Settings', value: `${data[0].player.userLanguage ? `Language: ${data[0].player.userLanguage}` : `Language: Unknown. Language Alerts won't function while this is unknown.` }\n${data[0].player.mcVersionRp ? `Version: ${data[0].player.mcVersionRp}` : `Version: Unknown. Version Alerts won't function while this is unknown.` }` });
                              if (!data[1].session.online && (data[0].player.lastLogout < data[0].player.lastLogin * 1)) embed.addField(`**API Limitation**`, `The Online Status API must be on\nfor Gametype data and alerts to \nfunction. Please turn it on.`);
                          } else if (data[1].session.online) {
                              embed.addFields({ name: 'Status', value: `${data[0].player.displayname} is online` }, { name: 'UUID', value: `${data[0].player.uuid}` }, { name: 'Session', value: `${data[0].player.lastLogin ? `Playtime: ${timeSinceLastLogin}` : `Playtime: Unknown`}\n${data[1].session.gameType ? `Game: ${data[1].session.gameType}\n` : `` }${data[1].session.mode ? `Mode: ${data[1].session.mode}\n` : `` }${data[1].session.map ? `Map: ${data[1].session.map}` : `` }${!data[1].session.gameType && !data[1].session.mode && !data[1].session.map ? `Data not available: Limited API!` : `` }` }, { name: 'Last Login', value: `${data[0].player.lastLogin ? `${timestampOfLastLogin} UTC ${decimalsToUTC(`${tz}`)}\n${timeSinceLastLogin} ago` : `Last Login: Unknown`}` }, { name: 'Last Logout', value: `${data[0].player.lastLogout ? `${timestampOfLastLogout} UTC ${decimalsToUTC(`${tz}`)}\n${timeSincefLastLogout} ago` : `Last Logout: Unknown`}` }, { name: 'Settings', value: `${data[0].player.userLanguage ? `Language: ${data[0].player.userLanguage}` : `Language: Unknown. Langauage Alerts won't function while this is unknown.` }\n${data[0].player.mcVersionRp ? `Version: ${data[0].player.mcVersionRp}` : `Version: Unknown. Version Alerts won't function while this is unknown.` }` });
                          }
                          msg.delete();
                          message.channel.send(embed);
                      })
                      .catch((err) => {
                        if (err.name === "AbortError") {
                            msg.delete();
                            message.channel.send(`${message.author}, an error occured while executing this command. The Hypixel API failed to respond and may be down. Try again later. <https://status.hypixel.net/>`);
                        } else {
                            msg.delete();
                            console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | Hypixel API Error 9: ${err}`);
                            message.channel.send(`${message.author}, Hypixel API Error: An error occured while executing this command. \`${err}\``);
                        }
                      });
              };
          
      })
  } catch (err) {
      console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | Something went very wrong outside of a promise catch. ${err}`);
      message.channel.send(`${message.author}, something went very wrong outside of a promise catch. Please report this. \`${err}\``);
  }    
	},
};
