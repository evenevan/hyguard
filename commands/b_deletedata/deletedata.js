const { MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu, Permissions } = require('discord.js');
const funcImports = require('../../functions.js');
const events = require('../../events.js');
const database = require('../../database.js');
module.exports = {
  	name: 'deletedata',
  	title: 'Delete all of your data',
	description: 'Delete all of your data. This command is essentially a "delete your account" function.',
  	usage: `\`/deletedata\``,
  	database: true,
  	guildOnly: true,
  	ownerReq: false,
  	cooldown: 10,
    commandPermissions: [],
  	botChannelPermissions: [],
  	botGuildPermissions: ["MANAGE_CHANNELS"],
	async execute(interaction, client, row) {
    let readData = funcImports.readOwnerSettings();
    let dst = readData.dst;

    let tzOffset = row ? (dst == true && row.daylightSavings == true ? row.timezone * 1 + 1: row.timezone) * 3600000 : 0;
    let tz = row ? (dst == true && row.daylightSavings == true ? row.timezone * 1 + 1: row.timezone) : 0;
    let timeString = row ? `${new Date(Date.now() + tzOffset).toLocaleTimeString('en-IN', { hour12: true })} UTC${funcImports.decimalsToUTC(tz)}` : `${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0`;
    
    let deleteDataEmbed = new MessageEmbed()
        .setTimestamp()
        .setFooter(`${interaction.id} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');
    let noResponseEmbed = new MessageEmbed()
        .setTimestamp()
        .setColor('#FF5555')
        .setTitle(`No Response!`)
        .setDescription('Setup has been canceled as you did not respond.')
        .setFooter(`${interaction.id} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');
    let updatedDeleteButton = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('true')
                .setLabel('Yes')
                .setStyle('SUCCESS')
                .setDisabled(true),
            new MessageButton()
                .setCustomId('false')
                .setLabel('No')
                .setStyle('DANGER')
                .setDisabled(true),
        );

    deleteDataEmbed.setColor('#7289DA');
    deleteDataEmbed.setTitle(`Confirmation!`);
    deleteDataEmbed.setDescription(`Are you absolutely sure that you want to delete all of your data? HyGuard will no longer monitor your account and send alerts. Please confirm with the buttons below.`);
        let deleteButton = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setCustomId('true')
					.setLabel('Yes')
					.setStyle('SUCCESS'),
                new MessageButton()
					.setCustomId('false')
					.setLabel('No')
					.setStyle('DANGER'),
			);
        await interaction.reply({ embeds: [deleteDataEmbed], components: [deleteButton] }).catch((err) => {return events.errorMsg(interaction, err)});
        let filter = i => {
            i.deferUpdate();
            return i.user.id === interaction.user.id;
        };
        let buttonMsg = await interaction.fetchReply()
        buttonMsg.awaitMessageComponent({ filter, componentType: 'BUTTON', time: 60000 })
	        .then(async i => {
                await interaction.editReply({ embeds: [deleteDataEmbed], components: [updatedDeleteButton] }).catch((err) => {return events.errorMsg(interaction, err)});
                if (i.customId === 'true') return userData();
                else {
                    deleteDataEmbed.setColor('#7289DA');
                    deleteDataEmbed.setTitle(`Aborted!`);
                    deleteDataEmbed.setDescription(`Data deletion canceled.`);
                    return await interaction.followUp({ embeds: [deleteDataEmbed], components: [] }).catch((err) => {return events.errorMsg(interaction, err)});
                }
            })
	        .catch(async (err) => {
                if (err.name === 'Error [INTERACTION_COLLECTOR_ERROR]') {
                    await interaction.followUp({ embeds: [noResponseEmbed], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
                    return await buttonMsg.edit({ embeds: [deleteDataEmbed], components: [updatedDeleteButton] }).catch((err) => {return events.errorMsg(interaction, err)});
                } else return events.errorMsg(interaction, err);
            });

    function userData() {
        requestGuild();

        async function requestGuild() {
            let guild = await client.guilds.cache.get(`${row.guildID}`);
            if (guild) await deleteLogs(guild) + await deleteAlerts(guild) + await deleteCategory(guild);
            return deleteData();
        }

        async function deleteLogs(guild) {
            let logs = await guild.channels.cache.get(row.logID);
            if (!logs) return;
            let logPermissions = await logs.permissionsFor(logs.guild.me).toArray();
            if (logs && logPermissions.includes("MANAGE_CHANNELS")) await logs.delete('User requested a data deletion').catch((err) => {return events.errorMsg(interaction, err)});
        };
            
        async function deleteAlerts(guild) {
            let alerts = await guild.channels.cache.get(row.alertID);
            if (!alerts) return;
            let alertPermissions = await alerts.permissionsFor(alerts.guild.me).toArray();
            if (alerts && alertPermissions.includes("MANAGE_CHANNELS")) await alerts.delete('User requested a data deletion').catch((err) => {return events.errorMsg(interaction, err)});
        };
            

        async function deleteCategory(guild) {
            let category = await guild.channels.cache.find(c => c.name == "log" && c.type == "GUILD_CATEGORY");
            if (!category) return;
            let channelPermissions = await category.permissionsFor(category.guild.me).toArray();
            if (category.children.size == 0 && channelPermissions.includes("MANAGE_CHANNELS")) await category.delete('Empty category channel').catch((err) => {return events.errorMsg(interaction, err)});
        };

        async function deleteData() {
            await database.deleteData(row.discordID, `DELETE FROM users WHERE discordID=(?)`);

            deleteDataEmbed.setColor('#7289DA');
            deleteDataEmbed.setTitle(`Data Deleted!`);
            deleteDataEmbed.setDescription(`Your data has been deleted.`);
            return await interaction.followUp({ embeds: [deleteDataEmbed], components: [] }).catch((err) => {return events.errorMsg(interaction, err)});
        }
    }
  },
};