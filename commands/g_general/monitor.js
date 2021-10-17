/* eslint-disable no-mixed-spaces-and-tabs */
const { MessageEmbed } = require('discord.js');
const funcImports = require('../../functions.js');
const events = require('../../events.js');
const database = require('../../database.js');
module.exports = {
  	name: 'monitor',
  	title: 'Toggles monitoring, alerts, and all checks for your account',
	description: 'Toggles monitoring, alerts, and all checks for your account. Toggling this off essentially makes the bot do nothing with your account.',
  	usage: `\`/monitor\``,
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

    let monitorEmbed = new MessageEmbed()
        .setTimestamp()
        .setFooter(`${interaction.id} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');

    toggleMonitor();
    async function toggleMonitor() {
        try {
            let response = await database.getData(interaction.user.id, `SELECT * FROM users WHERE discordID = ?`).catch((err) => {return events.errorMsg(interaction, err)});
          
            let currentLogState = response.log;

            currentLogState = 1 - currentLogState;
          
            writeMonitor(currentLogState);
          
        } catch (err) {
            return events.errorMsg(interaction, err);
        }
    }
          
    async function writeMonitor(currentLogState) {
        try {
            await database.changeData(interaction.user.id, `UPDATE users SET log = ? WHERE discordID = ?`, currentLogState);
            monitorEmbed.setTitle(`Monitoring Updated!`);
            monitorEmbed.setColor('#7289DA');
            monitorEmbed.setDescription(currentLogState === 1? `Monitoring, alerts, and checks are all now enabled for your account!` : `Monitoring, alerts, and checks are all now disabled for your account!`)
            monitorEmbed.addField(`Monitoring`, currentLogState === 1 ? `:green_square: - On` : `:red_square: - Off`)
            console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: New Data Written To Monitor`);
            return await interaction.reply({ embeds: [monitorEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
        } catch (err) {
            return events.errorMsg(interaction, err);
        }
    }
  },
};