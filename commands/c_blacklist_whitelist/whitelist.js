const { MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu, Permissions } = require('discord.js');
const funcImports = require('../../functions.js');
const events = require('../../events.js');
const database = require('../../database.js');
module.exports = {
  	name: 'whitelist',
  	title: 'Set whitelisted gametype(s) for Hypixel',
	description: 'Set whitelisted gametype(s) for Hypixel. If your account is detected not playing these games, the bot will alert you.',
  	usage: `\`[add/remove/current] <gametype>\``,
  	database: true,
  	guildOnly: false,
  	ownerReq: false,
  	cooldown: 5,
    commandPermissions: [],
  	botChannelPermissions: [],
  	botGuildPermissions: [],
	async execute(interaction, client, row) {
    let readData = funcImports.readOwnerSettings();
	let dst = readData.dst;

    let tzOffset = row ? (dst == true && row.daylightSavings == true ? row.timezone * 1 + 1: row.timezone) * 3600000 : 0;
    let tz = row ? (dst == true && row.daylightSavings == true ? row.timezone * 1 + 1: row.timezone) : 0;
    let timeString = row ? `${new Date(Date.now() + tzOffset).toLocaleTimeString('en-IN', { hour12: true })} UTC${funcImports.decimalsToUTC(tz)}` : `${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0`;

    let assets = funcImports.readAssets();
    let gametypes = assets.gametypes;

    let whitelistEmbed = new MessageEmbed()
        .setTimestamp()
        .setFooter(`${interaction.id} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');

    if (interaction.options.getSubcommand() === 'add' || interaction.options.getSubcommand() === 'remove') {
        if (!gametypes.includes(interaction.options.getString('gametype').toUpperCase())) {
            whitelistEmbed.setTitle(`Invalid Gametype!`);
            whitelistEmbed.setColor('#FF5555');
            whitelistEmbed.setDescription(`The gametype specified, "${interaction.options.getString('gametype').toUpperCase()}", is not valid. Please choose one of the following: ${gametypes.join(", ")}. You can find a table to translate between databae and clean names here: [__link__](https://api.hypixel.net/#section/Introduction/GameTypes)`);
            return await interaction.reply({ embeds: [whitelistEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
        }
        checkGametype();
    } else currentVersion();

    async function checkGametype() {
        try {
            let response = await database.getData(interaction.user.id, `SELECT * FROM users WHERE discordID = ?`).catch((err) => {return events.errorMsg(interaction, err)});

            let userWhitelist = response.whitelist ? response.whitelist.split(" ") : []
            let userBlacklist = response.blacklist ? response.blacklist.split(" ") : []

            if (interaction.options.getSubcommand() == 'add') {
                if (userWhitelist.includes(interaction.options.getString('gametype').toUpperCase())) {
                    whitelistEmbed.setTitle(`Already Added!`);
                    whitelistEmbed.setColor('#FF5555');
                    whitelistEmbed.setDescription(`${interaction.options.getString('gametype')} was already added to your gametype whitelist!`);
                    return await interaction.reply({ embeds: [whitelistEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                }

                userWhitelist.push(interaction.options.getString('gametype').toUpperCase())
                let combinedArrays = userBlacklist.concat(userWhitelist); //Compares to see if there are duplicate gametypes
                let hasDuplicatesBoolean = new Set(combinedArrays).size < combinedArrays.length;

                if (hasDuplicatesBoolean) {
                    whitelistEmbed.setTitle(`Already Added To Whitelist!`);
                    whitelistEmbed.setColor('#FF5555');
                    whitelistEmbed.setDescription(`${interaction.options.getString('gametype').toUpperCase()} was already added to your gametype blacklist! You cannot add a gametype to both!`);
                    return await interaction.reply({ embeds: [whitelistEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                }
                if (userWhitelist.length == 1) changeAlertState(response, 1);
            } else {
                if (!userWhitelist.includes(interaction.options.getString('gametype').toUpperCase())) {
                    whitelistEmbed.setTitle(`Not Added!`);
                    whitelistEmbed.setColor('#FF5555');
                    whitelistEmbed.setDescription(`${interaction.options.getString('gametype').toUpperCase()} has not been added to your gametype whitelist yet! You cannot remove a gametype from the whitelist that you have not added to the whitelist!`);
                    return await interaction.reply({ embeds: [whitelistEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                }
                let findIndex = userWhitelist.indexOf(interaction.options.getString('gametype').toUpperCase());
                userWhitelist.splice(findIndex, 1);
                if (userWhitelist.length == 0) changeAlertState(response, 0);
            }
          
            writeWhitelist(userWhitelist);
          
        } catch (err) {
            return events.errorMsg(interaction, err);
        }
    };

    async function changeAlertState(data, toggleBoolean) {  
        try {
          let alertsData = data.alerts.split(" ");

          alertsData[1] = toggleBoolean;
          await database.changeData(interaction.user.id, `UPDATE users SET alerts = ? WHERE discordID = ?`, alertsData.join(" "));
        } catch (err) {
          return events.errorMsg(interaction, err);
        }
    };
          
    async function writeWhitelist(userWhitelist) {
        try {
            await database.changeData(interaction.user.id, `UPDATE users SET whitelist = ? WHERE discordID = ?`, userWhitelist.join(" ").toUpperCase());
            whitelistEmbed.setTitle(`Gametype(s) Whitelist Updated!`);
            whitelistEmbed.setColor('#7289DA');
            whitelistEmbed.setDescription(`${interaction.options.getString('gametype').toUpperCase()} was ${interaction.options.getSubcommand() == 'add' ? `added to` : `removed from`} your whitelisted gametypes(s)! ${userWhitelist.length > 0 ? `Your whitelisted gametype(s) are ${userWhitelist.join(", ").toUpperCase()}.` : `You do not have any whitelisted games.`}`);
            userWhitelist.length == 1 ? whitelistEmbed.addField(`Alerts Updated`, `You have added a gametype to the whitelist, so your whitelisted games alerts were automatically turned on. You can turn them off with /alert whitelist.`) 
            : userWhitelist.length == 0 ? whitelistEmbed.addField(`Alerts Updated`, `You have removed all of the gametypes from your whitelist, so your whitelisted games alerts were automatically turned off. You can turn them on with /alert whitelist.`) 
            : ``; 
            return await interaction.reply({ embeds: [whitelistEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
        } catch (err) {
            return events.errorMsg(interaction, err);
        }
    };
          
    async function currentVersion() {
        try {
            let response = await database.getData(interaction.user.id, `SELECT * FROM users WHERE discordID = ?`).catch((err) => {return events.errorMsg(interaction, err)});
      
            whitelistEmbed.setTitle(`Your Whitelisted Gametype(s)!`);
            whitelistEmbed.setColor('#7289DA');
            whitelistEmbed.setDescription(`${response.whitelist.length > 0 ? `Your whitelisted gametype(s) are ${response.whitelist.split(" ").join(", ").toUpperCase()}.` : `You do not have any whitelisted games.`}`);
            return await interaction.reply({ embeds: [whitelistEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
        } catch (err) {
            return events.errorMsg(interaction, err);
        }
    };
  },
};