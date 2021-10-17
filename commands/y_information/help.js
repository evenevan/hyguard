/* eslint-disable no-mixed-spaces-and-tabs */
const { MessageEmbed } = require('discord.js');
const funcImports = require('../../functions.js');
const events = require('../../events.js');
module.exports = {
	name: 'help',
    title: 'Displays helpful information and available commands',
	description: 'Displays helpful information and available commands',
    usage: `\`/help <command name>\``,
    database: false,
    guildOnly: false,
    ownerReq: false,
    cooldown: 1,
	commandPermissions: [],
    botChannelPermissions: [],
    botGuildPermissions: [],
	async execute(interaction, row) {
	let readData = funcImports.readOwnerSettings();
    let dst = readData.dst;

    let tzOffset = row ? (dst == true && row.daylightSavings == true ? row.timezone * 1 + 1: row.timezone) * 3600000 : 0;
    let tz = row ? (dst == true && row.daylightSavings == true ? row.timezone * 1 + 1: row.timezone) : 0;
    let timeString = row ? `${new Date(Date.now() + tzOffset).toLocaleTimeString('en-IN', { hour12: true })} UTC${funcImports.decimalsToUTC(tz)}` : `${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC±0`;

	if (interaction.options.getSubcommand() == 'information') information();
    else if (interaction.options.getString('command')) specificCommand();
	else commands();

		async function information() {
			let informationHelp = new MessageEmbed()
				.setColor('#7289DA')
				.setTitle('Information!')
				.setDescription(`The HyGuard project was created to be an early warning system to alert users to prevent other nefarious individuals from hijacking your Minecraft account. It works by sending you your status on Hypixel on an interval, and alerting you on any unusual activity.`)
				.addField(`**Data Collection**`, `/setup requires your Minecraft username to verify your account. This is necessary to the above function. It must be linked on Hypixel to ensure you are the owner of that account. Information gathered by this bot to do the above function are your Discord username/ID, Minecraft username, timezone, language, and login/logout times for Hypixel to cross-reference. This data is stored locally in a SQLite database.\n\nAdditionally, the bot also collects the guild ID whenever a command is sent from a new guild. This data is for the /server command.`)
				.addField(`**Bug Reports and Suggestions**`, `Please report any bugs, exploits, or any suggestions to Attituding#6517. Join the [Hypixel Discord](https://discord.com/invite/hypixel) before you DM me so that you won't get blocked by Clyde. You can also [make a reply to the Hypixel forum post](https://hypixel.net/threads/discord-bot-hyguard-a-bot-that-monitors-your-account-24-7.4368395/) on this bot.`)
				.addField(`**GitHub**`, `This project has a [Github page](<https://github.com/Attituding/HyGuard>), where the code is available under the MIT license. There is also extra documentation there incase you need it.`)
				.setFooter(`Programmed by Attituding#6517 with help from the internet`, 'https://i.imgur.com/MTClkTu.png')
			await interaction.reply({ embeds: [informationHelp], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
		}

		async function commands() {
			let commandHelp = new MessageEmbed()
				.setColor('#7289DA')
				.setTitle('Commands!')
				.setDescription('Arguments in brackets are required. Arguments in arrows are sometimes required based on the previous argument. You can use the command /help [command] [choose a command from the list] to see more about a specific command.')
				.addField(':link: **Setup and Delete**', '**/setup [UUID or username]**: Allows players to begin using HyGuard\n' + 
											 '**/deletedata**: Delete all of your data')
				.addField(':clipboard: **Check Parameters**', '**/blacklist [add/remove/current] <gametype>**: Set blacklisted gametype(s) for Hypixel\n' + 
						  					  '**/whitelist [add/remove/current] <gametype>**: Set whitelisted gametype(s) for Hypixel\n' +
											  '**/language [set/current] <language>**: Set a new whitelisted language for Hypixel\n' +
											  '**/offlinetime [set/current]**: Update your offline time for Hypixel\n' +
											  '**/version [add/remove/current] <version>**: Set whitelisted version(s) for Hypixel')
				.addField(':bookmark: **Miscellaneous Parameters**', '**/timezone [set/current]**: Set your new timezone for the bot\'s time services\n' +
													 '**/alerts [toggle/current] <alert type>**: Update your current active alerts\n' +
													 '**/advanced [toggle/current] <setting>**: Update your advanced settings\n' +
													 '**/monitor**: Toggles monitoring, alerts, and all checks for your account\n')
				.addField(':tools: **Utility**', '**/server [channel] [add/remove/current] <channel>**: Modify server settings for this bot\n' +
									 '**/mojang**: Shows the status of Mojang\'s services\n' +
									 '**/ping**: Shows the ping of the bot')
				.addField(':mag: **API Commands**', '**/compromised [UUID or username]**: Displays stats and data of a Hypixel player in BB code\n' +
									 '**/recentgames [UUID or username]**: Displays the recent games of a Hypixel player\n' +
									 '**/status [UUID or username]**: Displays the status of a Hypixel player')
				.addField(':information_source: **Help**', '**/help <command>**: Displays helpful information and available commands')
				.setFooter(`${interaction.id} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');
			await interaction.reply({ embeds: [commandHelp], ephemeral: true }).catch((err) => {return events.errorMsg(interaction, err)});
		}

		async function specificCommand() {
			let commandArg = interaction.options.getString('command');
			let { commands } = interaction.client;
			let command = commands.get(commandArg);

			let commandEmbed = new MessageEmbed()
				.setTitle(`/${command.name}`)
				.setColor('#7289DA')
				.setTimestamp()
				.setFooter(`${interaction.id} | ${timeString}`, 'https://i.imgur.com/MTClkTu.png');

			if (!command) {
				commandEmbed.setColor('#ff5555');
				commandEmbed.setTitle(`Invalid Command!}`);
				commandEmbed.setDescription(`That isn't a valid command!`);
				return interaction.reply({ embeds: [commandEmbed], ephemeral: true }).catch((err) => {events.errorMsg(interaction, err)})
			}

			if (command.description) commandEmbed.setDescription(`${command.description}`);
			if (command.usage) commandEmbed.addField(`Usage`, `${command.usage}`);
			if (command.cooldown != undefined) commandEmbed.addField(`Command Cooldown`, `${command.cooldown} second(s)`);
	  		if (command.commandPermissions.length > 0) commandEmbed.addField(`User Required Permission(s)`, `${command.commandPermissions}`);
			if (command.botChannelPermissions.length > 0) commandEmbed.addField(`Required Bot Permission(s)`, `${command.botChannelPermissions}`);
			if (command.botGuildPermissions.length > 0) commandEmbed.addField(`Required Bot Server Permission(s)`, `${command.botGuildPermissions}`);
			if (command.ownerReq == true) commandEmbed.addField(`Bot Owner`, `Being an owner is required to execute this command`);

			return interaction.reply({ embeds: [commandEmbed], ephemeral: true }).catch((err) => {events.errorMsg(interaction, err)})
		}

	},
};