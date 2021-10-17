/* eslint-disable no-mixed-spaces-and-tabs */
const { MessageEmbed } = require('discord.js');
const funcImports = require('../../functions.js');
const events = require('../../events.js');
const database = require('../../database.js');
module.exports = {
  	name: 'alerts',
  	title: 'Update your current active alerts',
	  description: 'Update your current active alerts. Youc an indivudally toggle the 6 alert types.',
  	usage: `\`/alerts [toggle/current] <alert type>\``,
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

    let alertsEmbed = new MessageEmbed()
        .setTimestamp()
        .setFooter(`${interaction.id} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');

    if ((interaction.options.getSubcommand() === 'toggle')) {
        checkAlerts();
    } else currentAlerts();

    async function checkAlerts() {
        try {
            let response = await database.getData(interaction.user.id, `SELECT * FROM users WHERE discordID = ?`).catch((err) => {return events.errorMsg(interaction, err)});
          
            let userAlerts = response.alerts.split(" ");

            switch (true) {
                case interaction.options.getString('type') === 'blacklist':
                  userAlerts[0] = (1 - userAlerts[0]);
                  break;
                case interaction.options.getString('type') === 'whitelist':
                  userAlerts[1] = (1 - userAlerts[1]);
                  break;
                case interaction.options.getString('type') === 'language':
                  userAlerts[2] = (1 - userAlerts[2]);
                  break;
                case interaction.options.getString('type') === 'session':
                  userAlerts[3] = (1 - userAlerts[3]);
                  break;
                case interaction.options.getString('type') === 'offlinetime':
                   userAlerts[4] = (1 - userAlerts[4]);
                  break;
                case interaction.options.getString('type') === 'version':
                  userAlerts[5] = (1 - userAlerts[5]);
                  break;
            }
              
            writeAlerts(userAlerts);
          
        } catch (err) {
            return events.errorMsg(interaction, err);
        }
    }
          
    async function writeAlerts(userAlerts) {
        try {
            await database.changeData(interaction.user.id, `UPDATE users SET alerts = ? WHERE discordID = ?`, userAlerts.join(" "));
            let a = userAlerts.map(function(item) { return item == '1' ? ':green_square: - On' : item; });
            let alertsClean = a.map(function(item) { return item == '0' ? ':red_square: - Off' : item; });

            alertsEmbed.setTitle(`Alerts Updated!`);
            alertsEmbed.setColor('#7289DA');
            alertsEmbed.addFields(
                { name: 'Blacklisted Games Alerts', value: `${alertsClean[0]}` },
                { name: 'Non-Whitelisted Games Alerts', value: `${alertsClean[1]}` },
                { name: 'Language Alerts', value: `${alertsClean[2]}` },
                { name: 'Login/Logout/Relog Alerts', value: `${alertsClean[3]}` },
                { name: 'Offline Time Alerts', value: `${alertsClean[4]}` },
                { name: 'Version Alerts', value: `${alertsClean[5]}` },
              )
            console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: New Data Written To Alerts`);
            return await interaction.reply({ embeds: [alertsEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
        } catch (err) {
            return events.errorMsg(interaction, err);
        }
    }
          
    async function currentAlerts() {
        try {
            let response = await database.getData(interaction.user.id, `SELECT * FROM users WHERE discordID = ?`).catch((err) => {return events.errorMsg(interaction, err)});
            let userAlerts = response.alerts.split(" ");
            let a = userAlerts.map(function(item) { return item == '1' ? ':green_square: - On' : item; });
            let alertsClean = a.map(function(item) { return item == '0' ? ':red_square: - Off' : item; });
      
            alertsEmbed.setTitle(`Your Alerts!`);
            alertsEmbed.setColor('#7289DA');
            alertsEmbed.addFields(
                { name: 'Blacklisted Games Alert', value: `${alertsClean[0]}` },
                { name: 'Non-Whitelisted Games Alert', value: `${alertsClean[1]}` },
                { name: 'Language Alert', value: `${alertsClean[2]}` },
                { name: 'Login/Logout/Relog Alerts', value: `${alertsClean[3]}` },
                { name: 'Offline Time Alerts', value: `${alertsClean[4]}` },
                { name: 'Version Alerts', value: `${alertsClean[5]}` },
              )
            console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Returned Current Alerts`);
            return await interaction.reply({ embeds: [alertsEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
        } catch (err) {
            return events.errorMsg(interaction, err);
        }
    }
  },
};