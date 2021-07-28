const { prefix } = require('../../userConfig.json');
const funcImports = require( __dirname + '../../../functions');
const Discord = require('discord.js');
module.exports = {
	name: 'help',
	title: 'Displays helpful information',
	description: 'Lists basic info and all commands or detailed info about a specific command',
	aliases: ['commands'],
	usage: `\`${prefix}help <command name>\``,
  database: false,
	cooldown: 1,
	permissions: ["VIEW_CHANNEL","SEND_MESSAGES","EMBED_LINKS"],
	execute(message, args, client, row) {
		if (row !== undefined) {
			let readData = funcImports.readOwnerSettings();
    		let dst = readData.dst;
			var tzOffset = (dst == true ? row.timezone * 1 + 1: row.timezone) * 3600000;
			var timeString = new Date(Date.now() + tzOffset).toLocaleTimeString('en-IN', { hour12: true }); 
			var dateString = funcImports.epochToCleanDate(new Date(Date.now() + tzOffset))
		} else {
			var tzOffset = 0
			var timeString = `${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC`
			var dateString = funcImports.epochToCleanDate(new Date())
		}

		const { commands } = message.client;
		function removeAllUndefined(arr, value) {
			var i = 0;
			while (i < arr.length) {
			  if (arr[i] === value) {
				arr.splice(i, 1);
			  } else {
				++i;
			  }
			}
			return arr;
		  }

		if (!args.length) {
			let commandName = commands.map(command => prefix + command.name);
			let commandTitle = commands.map(command => command.title);
			let commandSetupReq = commands.map(command => command.database);
			let commandOwner = commands.map(command => command.ownerReq);

			for (let o = 0; o < commandOwner.length; o++) {
				let index = commandOwner[o]
				if (index) {
					commandName[o] = undefined;
					commandTitle[o] = undefined;
					commandSetupReq[o] = undefined;
				}
			}
				
		commandTitle = removeAllUndefined(commandTitle, undefined);
		commandName = removeAllUndefined(commandName, undefined);
		commandSetupReq = removeAllUndefined(commandSetupReq, undefined);
	
      const commandHelp = new Discord.MessageEmbed()
        .setColor('#7289DA')
        .setTitle(`**Information**`)
        .setFooter(`Programmed by Attituding#6517 with help from the internet`, 'https://i.imgur.com/MTClkTu.png')
		.setDescription(`The HyGuard project was created to be an early warning system to alert users to prevent other nefarious individuals from hijacking your Minecraft account. It works by sending you your status on Hypixel on an interval, and alerting you on any unusual activity. This bot isn't most user-friendly, but used the right way, it works.`)
		.addField(`**Data Collection**`, `${prefix}setup requires your Minecraft username to verify your account. This is necessary to the above function. It must be linked on Hypixel to ensure you are the owner of that account. Information gathered by this bot to do the above function are your Discord username/ID, Minecraft username, timezone, language, and login/logout times for Hypixel to cross-reference.`)
		.addField(`**Bug Reports and Suggestions**`, `Please report any bugs, exploits, or any suggestions to Attituding#6517. Join the [Hypixel Discord](https://discord.com/invite/hypixel) before you DM me so that you won't get blocked by Clyde.`)
		.addField(`**GitHub**`, `This project has a [Github page](<https://github.com/Attituding/HyGuard>), where the code is available under the MIT license. There is also extra documentation there incase you need it.`)
		.addField('**Available Commands**', `You can send \`${prefix}help <command name>\` to get info on a specific command, along with aliases that can also execute the same command! Commands with a :white_check_mark: work without ${prefix}setup, while commands with :no_entry_sign: require ${prefix}setup\n\u200B`)

			for (let i = 0; i < commandName.length; i++) {
				commandHelp.addField(`**${commandName[i]}** ${commandSetupReq[i] == true ? `:no_entry_sign:` : `:white_check_mark:`}`, `${commandTitle[i]}`, true)
			  }

			return message.author.send(commandHelp)
				.then(() => {
					if (message.channel.type === 'dm') return;
					message.channel.send(`${message.author}, a DM has been sent to you with basic information and all available commands!`);
				})
				.catch(error => {
					console.error(`Could not send help DM to ${message.author.tag}.\n`, error);
					message.channel.send(`${message.author}, it seems like this bot cannot DM you! Turn on \`Allow direct messages from server members\` in the privacys settings of this server!`);
				});
		}

		const name = args[0].toLowerCase();
		const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

		if (!command) {
			return message.channel.send(`${message.author}, that\'s not a valid command!`);
		}

    const commandHelp = new Discord.MessageEmbed()
        .setColor('#7289DA')
        .setTitle(`${prefix}${command.name}`)
        .setFooter(`Executed at ${timeString} | ${dateString}`, 'https://i.imgur.com/MTClkTu.png');
		if (command.description) commandHelp.setDescription(`${command.description}`);
        if (command.aliases) commandHelp.addField(`Aliases`, `${prefix + command.aliases.join(`, ${prefix}`)}`);
        if (command.usage) commandHelp.addField(`Usage`, `${command.usage}`);
        if (command.cooldown != undefined) commandHelp.addField(`Cooldown`, `${command.cooldown} second(s)`);
        if (command.permissions || command.ownerReq) commandHelp.addField(`Required Permission(s)`, `${command.permissions && command.ownerReq ? `${command.permissions}\nBot Owner` : `${command.permissions ? `${command.permissions}` : `Bot Owner` }` }`);
message.reply(commandHelp).catch(err => {
	console.error(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | Caught an error while executing a command from ${message.author.tag}.\n`, err);
});
	},
};