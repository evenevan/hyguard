/* eslint-disable no-mixed-spaces-and-tabs */
const { MessageEmbed } = require('discord.js');
const funcImports = require('../../functions.js');
const database = require('../../database.js');
const events = require('../../events.js');
module.exports = {
  	name: 'server',
  	title: 'Modify server settings for this bot',
	  description: 'Allows members with the Manage Server permission to edit the bot settings for this server',
  	usage: `\`/server [channel] [add/remove/current] <channel>\``,
  	database: false,
  	guildOnly: true,
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

    switch (interaction.options.getSubcommandGroup()) {
        case 'channel':
            channel(interaction.options.getSubcommand(), interaction.options.getChannel('channel'));
            break;
        case 'enabled':
            enabled(); //This command is currently disabled
            break;
    }

    async function channel(subCommand, channel) {
      let channelEmbed = new MessageEmbed()
        .setTitle(`API State Updated!`)
        .setTimestamp()
        .setFooter(`${interaction.id} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');

      let response = await database.getData(interaction.guild.id, `SELECT * FROM servers WHERE serverID = ?`).catch((err) => {return events.errorMsg(interaction, err)});
      let serverChannels = response.channels ? response.channels.split(" ") : []

      if (subCommand === 'current') {
          let cleanChannel = serverChannels.length > 0 ? `<#${serverChannels.join(">\n<#")}>` : `You have no whitelisted channels set, so commands can be used in all channels currently.`
          channelEmbed.setTitle(`Channel Whitelist!`);
          channelEmbed.setColor('#7289DA');
          channelEmbed.addField(`Whitelisted Channels`, cleanChannel)
          console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Returned Current Whitelisted Channels`);
          return await interaction.reply({ embeds: [channelEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
      }

      if (channel.type !== "GUILD_TEXT") {
          channelEmbed.setTitle(`Invalid Channel!`);
          channelEmbed.setColor('#FF5555');
          channelEmbed.setDescription(`That channel is invalid! It must be a text channel!`);
          console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Invalid Channel`);
          return await interaction.reply({ embeds: [channelEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
      }

      if (subCommand === 'add') {
        if (serverChannels.includes(channel.id)) {
            channelEmbed.setTitle(`Already Added!`);
            channelEmbed.setColor('#FF5555');
            channelEmbed.setDescription(`That channel was already added to the channel whitelist!`);
            console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Already Added`);
            return await interaction.reply({ embeds: [channelEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
        }
        serverChannels.push(channel.id)
      } else {
        if (!serverChannels.includes(channel.id)) {
          channelEmbed.setTitle(`Not Added!`);
          channelEmbed.setColor('#FF5555');
          channelEmbed.setDescription(`Thatc hannel has not been whitelisted yet! You cannot remove a channel that hasn't been added!`);
          console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Not Added`);
          return await interaction.reply({ embeds: [channelEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
        }
        let findIndex = serverChannels.indexOf(channel.id);
        serverChannels.splice(findIndex, 1);
      }
      await database.changeData(interaction.guild.id, `UPDATE servers SET channels = ? WHERE serverID = ?`, serverChannels.join(" "));
      let cleanChannel = `<#${serverChannels.join(">\n<#")}>`
      channelEmbed.setTitle(`Updated Channel Whitelist!`);
      channelEmbed.setColor('#7289DA');
      channelEmbed.setDescription(`The channel whitelist has been updated! ${serverChannels.length > 0 ? `HyGuard commands can be used in these channels.` : `HyGuard commands can be used in any channel.`}`);
      if (serverChannels.length > 0) channelEmbed.addField(`Whitelisted Channels`, cleanChannel)
      console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: New Data Written To Whitelisted Channels`);
      return await interaction.reply({ embeds: [channelEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
    }

    async function enabled() { //Isn't enabled currently as I don't see a point for this right now
      let enabledEmbed = new MessageEmbed()
        .setTitle(`API State Updated!`)
        .setTimestamp()
        .setFooter(`${interaction.id} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');

      let response = await database.getData(interaction.guild.id, `SELECT * FROM servers WHERE serverID = ?`).catch((err) => {return events.errorMsg(interaction, err)});
      let newToggle = 1 - response.enabled;
      await database.changeData(interaction.guild.id, `UPDATE servers SET enabled = ? WHERE serverID = ?`, newToggle);

      enabledEmbed.setTitle(`Updated Enabled State!`);
      enabledEmbed.setColor('#7289DA');
      enabledEmbed.setDescription(`Commands for this bot are ${newToggle === 1 ? `now enabled` : `disabled`}! Logging still works normally.`);
      // eslint-disable-next-line no-undef
      if (serverChannels.length > 0) enabledEmbed.addField(`Whitelisted Channels`, cleanChannel)
      console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: New Data Written To Enabled Status`);
      return await interaction.reply({ embeds: [enabledEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
    }

  },
};