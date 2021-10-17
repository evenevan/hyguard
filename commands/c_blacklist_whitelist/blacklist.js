/* eslint-disable no-mixed-spaces-and-tabs */
const { MessageEmbed } = require('discord.js');
const funcImports = require('../../functions.js');
const events = require('../../events.js');
const database = require('../../database.js');
module.exports = {
  	name: 'blacklist',
  	title: 'Set blacklisted gametype(s) for Hypixel',
	description: 'Set blacklisted gametype(s) for Hypixel. If your account is detected playing these games, the bot will alert you.',
  	usage: `\`[add/remove/current] <gametype>\``,
  	database: true,
  	guildOnly: false,
  	ownerReq: false,
  	cooldown: 5,
    commandPermissions: [],
  	botChannelPermissions: [],
  	botGuildPermissions: [],
	async execute(interaction, row) {
    let readData = funcImports.readOwnerSettings();
	let dst = readData.dst;

    let tzOffset = row ? (dst == true && row.daylightSavings == true ? row.timezone * 1 + 1: row.timezone) * 3600000 : 0;
    let tz = row ? (dst == true && row.daylightSavings == true ? row.timezone * 1 + 1: row.timezone) : 0;
    let timeString = row ? `${new Date(Date.now() + tzOffset).toLocaleTimeString('en-IN', { hour12: true })} UTC${funcImports.decimalsToUTC(tz)}` : `${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0`;

    let assets = funcImports.readAssets();
    let gametypes = assets.gametypes;

    let blacklistEmbed = new MessageEmbed()
        .setTimestamp()
        .setFooter(`${interaction.id} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');

    if (interaction.options.getSubcommand() === 'add' || interaction.options.getSubcommand() === 'remove') {
        if (!gametypes.includes(interaction.options.getString('gametype').toUpperCase())) {
            blacklistEmbed.setTitle(`Invalid Gametype!`);
            blacklistEmbed.setColor('#FF5555');
            blacklistEmbed.setDescription(`The gametype specified, "${interaction.options.getString('gametype').toUpperCase()}", is not valid. Please choose one of the following: ${gametypes.join(", ")}. You can find a table to translate between databae and clean names here: [__link__](https://api.hypixel.net/#section/Introduction/GameTypes)`);
            console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Invalid Gametype`);
            return await interaction.reply({ embeds: [blacklistEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
        }
        checkGametype();
    } else currentVersion();

    async function checkGametype() {
        try {
            let response = await database.getData(interaction.user.id, `SELECT * FROM users WHERE discordID = ?`).catch((err) => {return events.errorMsg(interaction, err)});

            let userBlacklist = response.blacklist ? response.blacklist.split(" ") : []
            let userWhitelist = response.whitelist ? response.whitelist.split(" ") : []

            if (interaction.options.getSubcommand() == 'add') {
                if (userBlacklist.includes(interaction.options.getString('gametype').toUpperCase())) {
                    blacklistEmbed.setTitle(`Already Added!`);
                    blacklistEmbed.setColor('#FF5555');
                    blacklistEmbed.setDescription(`${interaction.options.getString('gametype')} was already added to your gametype blacklist!`);
                    console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Already Added`);
                    return await interaction.reply({ embeds: [blacklistEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                }

                userBlacklist.push(interaction.options.getString('gametype').toUpperCase())
                let combinedArrays = userWhitelist.concat(userBlacklist); //Checks for duplicate gametypes
                let hasDuplicatesBoolean = new Set(combinedArrays).size < combinedArrays.length;

                if (hasDuplicatesBoolean) {
                    blacklistEmbed.setTitle(`Already Added To Whitelist!`);
                    blacklistEmbed.setColor('#FF5555');
                    blacklistEmbed.setDescription(`${interaction.options.getString('gametype').toUpperCase()} was already added to your gametype whitelist! You cannot add a gametype to both!`);
                    console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Already Added To Whitelist`);
                    return await interaction.reply({ embeds: [blacklistEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                }
                if (userBlacklist.length == 1) changeAlertState(response, 1);
            } else {
                if (!userBlacklist.includes(interaction.options.getString('gametype').toUpperCase())) {
                    blacklistEmbed.setTitle(`Not Added!`);
                    blacklistEmbed.setColor('#FF5555');
                    blacklistEmbed.setDescription(`${interaction.options.getString('gametype').toUpperCase()} has not been added to your gametype blacklist yet! You cannot remove a gametype from the blacklist that you have not added to the blacklist!`);
                    console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Not Added`);
                    return await interaction.reply({ embeds: [blacklistEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                }
                let findIndex = userBlacklist.indexOf(interaction.options.getString('gametype').toUpperCase());
                userBlacklist.splice(findIndex, 1);
                if (userBlacklist.length == 0) changeAlertState(response, 0);
            }
          
            writeBlacklist(userBlacklist);
          
        } catch (err) {
            return events.errorMsg(interaction, err);
        }
    }

    async function changeAlertState(data, toggleBoolean) {  
        try {
          let alertsData = data.alerts.split(" ");

          alertsData[0] = toggleBoolean;
          await database.changeData(interaction.user.id, `UPDATE users SET alerts = ? WHERE discordID = ?`, alertsData.join(" "));
        } catch (err) {
          return events.errorMsg(interaction, err);
        }
    }
          
    async function writeBlacklist(userBlacklist) {
        try {
            await database.changeData(interaction.user.id, `UPDATE users SET blacklist = ? WHERE discordID = ?`, userBlacklist.join(" ").toUpperCase());
            blacklistEmbed.setTitle(`Gametype(s) Blacklist Updated!`);
            blacklistEmbed.setColor('#7289DA');
            blacklistEmbed.setDescription(`${interaction.options.getString('gametype').toUpperCase()} was ${interaction.options.getSubcommand() == 'add' ? `added to` : `removed from`} your blacklisted gametypes(s)! ${userBlacklist.length > 0 ? `Your blacklisted gametype(s) are ${userBlacklist.join(", ").toUpperCase()}.` : `You do not have any blacklisted games.`}`);
            userBlacklist.length == 1 ? blacklistEmbed.addField(`Alerts Updated`, `You have added a gametype to the blacklist, so your blacklisted games alerts were automatically turned on. You can turn them off with /alert blacklist.`) 
            : userBlacklist.length == 0 ? blacklistEmbed.addField(`Alerts Updated`, `You have removed all of the gametypes from your blacklist, so your blacklisted games alerts were automatically turned off. You can turn them on with /alert blacklist.`) 
            : ``;
            console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: New Data Written To Blacklist`);
            return await interaction.reply({ embeds: [blacklistEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
        } catch (err) {
            return events.errorMsg(interaction, err);
        }
    }
          
    async function currentVersion() {
        try {
            let response = await database.getData(interaction.user.id, `SELECT * FROM users WHERE discordID = ?`).catch((err) => {return events.errorMsg(interaction, err)});
      
            blacklistEmbed.setTitle(`Your Blacklisted Gametype(s)!`);
            blacklistEmbed.setColor('#7289DA');
            blacklistEmbed.setDescription(`${response.blacklist.length > 0 ? `Your blacklisted gametype(s) are ${response.blacklist.split(" ").join(", ").toUpperCase()}.` : `You do not have any blacklisted games.`}`);
            console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Current Blacklisted Gametypes Returned`);
            return await interaction.reply({ embeds: [blacklistEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
        } catch (err) {
            return events.errorMsg(interaction, err);
        }
    }
  },
};