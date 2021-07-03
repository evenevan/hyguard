const fs = require('fs');
const Discord = require('discord.js');
const { prefix } = require('../../userConfig.json');
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
	execute(message, args, client, row) {
    if (row !== undefined) {
      var tzOffset = (row.timezone * 3600000);
      var tz = row.timezone
      var timeString = new Date(Date.now() + tzOffset).toLocaleTimeString('en-IN', { hour12: true }); 
      var dateString = new Date(Date.now() + tzOffset).toLocaleDateString('en-IN', { hour12: true });  
    } else {
      var tzOffset = 0
      var tz = 0
      var timeString = `${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC`
      var dateString = new Date().toLocaleDateString('en-IN', { hour12: true });
    }

    try {
      message.channel.send('Loading..').then(async msg => {
        const controller = new AbortController();
        
        const readData = funcImports.readOwnerSettings();
        const api = readData.api;

        if (api == false) {
          msg.delete();
          return message.channel.send(`${message.author}, this command is temporarily disabled as the API is down!`).then(async msg => {
          setTimeout(() => {
            msg.delete();
          }, 10000);
        });
      }
    
        if (!/^[\w+]{1,16}$/gm.test(args[0])) {
          msg.delete();
          return message.channel.send(`${message.author}, that doesn't seem to be a valid Minecraft username!`).then(async msg => {
            setTimeout(() => {
              msg.delete();
            }, 10000);
          });
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
    
        Promise.all([
            fetchTimeout(`https://api.slothpixel.me/api/players/${args[0]}/`, 2000, {
              signal: controller.signal
            }).then(player => player.json()),
            fetchTimeout(`https://api.slothpixel.me/api/players/${args[0]}/status`, 2000, {
              signal: controller.signal
            }).then(status => status.json())
          ])
          .then((player) => {
            if (player[0].hasOwnProperty('error')) {
              msg.delete();
              return message.channel.send(`${message.author}, that username doesn\'t seem to be valid.`).then(async msg => {
                setTimeout(() => {
                  msg.delete();
                }, 10000);
              });
            }

            const timeSinceLastLogin = `${secondsToDays(new Date() - player[0].last_login)}${new Date(new Date() - player[0].last_login).toISOString().substr(11, 8)}`;
            const timeSincefLastLogout = `${secondsToDays(new Date() - player[0].last_logout)}${new Date(new Date() - player[0].last_logout).toISOString().substr(11, 8)}`;
        
            const timestampOfLastLogin = new Date(player[0].last_login + tzOffset).toLocaleString('en-IN', { hour12: true });
            const timestampOfLastLogout = new Date(player[0].last_logout + tzOffset).toLocaleString('en-IN', { hour12: true });
        
            const lastPlaytime = `${secondsToDays(player[0].last_logout - player[0].last_login)}${new Date(player[0].last_logout - player[0].last_login).toISOString().substr(11, 8)}`;
        
          function secondsToDays(ms) { //calculating days from seconds
              ms = ms / 1000
              let day = Math.floor(ms / (3600 * 24));
              let days = day > 0 ? day + (day == 1 ? ' day ' : ' days ') : ''; //may be a grammar bug somewhere here
              return days;
            };
        
        let embed = new Discord.MessageEmbed()
        .setColor('#7289DA')
        .setTitle(`Status of ${player[0].username}`)
        .setDescription(`Data is not quite real-time, and some fields may be inaccurate.`)
        .setFooter(`Executed at ${dateString} | ${timeString}`, 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/e/e9/Book_and_Quill_JE2_BE2.png/revision/latest/scale-to-width-down/160?cb=20190530235621');
        if (!player[1].online) {
            embed.addFields(
            { name: 'Status', value: `${player[0].username} is offline` },
            { name: 'UUID', value: `${player[0].uuid}` },
            { name: 'Last Session', value: `${player[0].last_login ? `Last Playtime: ${lastPlaytime} long` : `Playtime: Unknown`}\n${player[0].last_game ? `Last Gametype: ${player[0].last_game}` : `Last Gametype: Unknown` }` },
            { name: 'Last Login', value: `${player[0].last_login ? `${timestampOfLastLogin} UTC ${decimalsToUTC(tz)}\n${timeSinceLastLogin} ago` : `Unknown` }` },
            { name: 'Last Logout', value: `${player[0].last_logout ? `${timestampOfLastLogout} UTC ${decimalsToUTC(tz)}\n${timeSincefLastLogout} ago` : `Unknown` }` },
            { name: 'Settings', value: `${player[0].language ? `Language: ${player[0].language}` : `Language: Unknown` }\n${player[0].mc_version ? `Version: ${player[0].mc_version}` : `Version: Unknown` }` });
                if (!player[1].online && (player[0].last_logout < player[0].last_login * 1)) embed.addField(`**API Limitation**`, `There is a possible API limitation which hides some information.`);
          } else if (player[1].online) {
            embed.addFields(
            { name: 'Status', value: `${player[0].username} is online` },
            { name: 'UUID', value: `${player[0].uuid}` },
            { name: 'Session', value: `${player[0].last_login ? `Playtime: ${timeSinceLastLogin}` : `Playtime: Unknown`}\n${player[1].game.type ? `Game: ${player[1].game.type}\n` : `` }${player[1].game.mode ? `Mode: ${player[1].game.mode}\n` : `` }${player[1].game.map ? `Map: ${player[1].game.map}` : `` }${!player[1].game.type && !player[1].game.mode && !player[1].game.map ? `Data not available: Limited API!` : `` }` },
            { name: 'Last Login', value: `${player[0].last_login ? `${timestampOfLastLogin} UTC ${decimalsToUTC(tz)}\n${timeSinceLastLogin} ago` : `Last Login: Unknown`}` },
            { name: 'Last Logout', value: `${player[0].last_logout ? `${timestampOfLastLogout} UTC ${decimalsToUTC(tz)}\n${timeSincefLastLogout} ago` : `Last Logout: Unknown`}` },
            { name: 'Settings', value: `${player[0].language ? `Language: ${player[0].language}` : `Language: Unknown` }\n${player[0].mc_version ? `Version: ${player[0].mc_version}` : `Version: Unknown` }` });
        }
        msg.delete();
        message.reply(embed);
    
          })
          .catch((err) => {
            if (err.name === "AbortError") {
              msg.delete();
              message.channel.send(`${message.author}, an error occured while executing this command. The API failed to respond, and may be down. Try again later. <https://status.hypixel.net/>`);
            } else {
              msg.delete();
              console.log(`API Error 9: ${err}`);
              message.channel.send(`${message.author}, an error occured while executing this command. This error is expected to occur occasionally. Please report this if it continues. ERROR_9: \`${err}\``);
            }
          });
      })
    } catch (err) {
      console.log(`Error 10: ${err}`);
      message.channel.send(`${message.author}, something went very wrong outside of a promise catch. Please report this. ERROR_10: \`${err}\``);
    }
    
	},
};
