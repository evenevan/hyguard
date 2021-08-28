const { MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu, Permissions } = require('discord.js');
const funcImports = require('../../functions.js');
const events = require('../../events.js');
module.exports = {
  	name: 'ping',
  	title: 'Displays the ping of the bot',
	description: 'Shows the ping of the bot',
  	usage: `\`/ping\``,
  	database: false,
  	guildOnly: false,
  	ownerReq: false,
  	cooldown: 1,
	commandPermissions: [],
  	botChannelPermissions: [],
  	botGuildPermissions: [],
	async execute(interaction, client, row) {
		let readData = funcImports.readOwnerSettings();
		let dst = readData.dst;
		
		let tzOffset = row ? (dst == true ? row.timezone * 1 + 1: row.timezone) * 3600000 : 0;
    	let tz = row ? row.timezone : 0;
    	let timeString = row ? `${new Date(Date.now() + tzOffset).toLocaleTimeString('en-IN', { hour12: true })} UTC${funcImports.decimalsToUTC(tz)}` : `${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0`;
    	let dateString = row ? funcImports.epochToCleanDate(new Date(Date.now() + tzOffset)) : funcImports.epochToCleanDate(new Date());
		let pingEmbed = new MessageEmbed()
        	.setColor('#00AA00')
        	.setTitle(`Pinging..`)
			.setTimestamp()
        	.setFooter(`Executed at ${timeString} | ${dateString}`, 'https://i.imgur.com/MTClkTu.png');
		await interaction.reply({ embeds: [pingEmbed], fetchReply: true }).catch((err) => {return events.errorMsg(interaction, err)});
		let sentReply = await interaction.fetchReply().catch((err) => {return events.errorMsg(interaction, err)});
			pingEmbed.setColor(`7289DA`)
			pingEmbed.setTitle(`🏓 Ping!`)
			pingEmbed.setDescription(` Roundtrip latency is ${sentReply.createdTimestamp - interaction.createdTimestamp}ms. Websocket heartbeat is ${client.ws.ping}ms.`)
		await interaction.editReply({ embeds: [pingEmbed] }).catch((err) => {return events.errorMsg(interaction, err)});
		return console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0 | ${funcImports.epochToCleanDate(new Date())} | Interaction ${interaction.id} User: ${interaction.user.username}#${interaction.user.discriminator} Status: Roundtrip latency is ${sentReply.createdTimestamp - interaction.createdTimestamp}. Websocket heartbeat is ${client.ws.ping}ms.`);
	},
};