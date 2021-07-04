const { prefix } = require('../../userConfig.json');
const Discord = require('discord.js');
module.exports = {
	name: 'help',
	title: 'Displays helpful information',
	description: 'Lists basic info and all commands or detailed info about a specific command',
	aliases: ['commands'],
	usage: `\`${prefix}help <command name>\``,
  database: false,
	cooldown: 2.5,
	execute(message, args, client, row) {
		if (row !== undefined) {
			var tzOffset = (row.timezone * 3600000);
			var timeString = new Date(Date.now() + tzOffset).toLocaleTimeString('en-IN', { hour12: true }); 
			var dateString = new Date(Date.now() + tzOffset).toLocaleDateString('en-IN', { hour12: true });  
		  } else {
			var tzOffset = 0
			var timeString = `${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC`
			var dateString = new Date().toLocaleDateString('en-IN', { hour12: true });
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
			let commandOwner = commands.map(command => command.ownerReq);

			for (let o = 0; o < commandOwner.length; o++) {
				let index = commandOwner[o]
				if (index) {
					commandName[o] = undefined;
					commandTitle[o] = undefined;
				}
			}
				
		commandTitle = removeAllUndefined(commandTitle, undefined);
		commandName = removeAllUndefined(commandName, undefined);
	
      const commandHelp = new Discord.MessageEmbed()
        .setColor('#7289DA')
        .setTitle(`**Information**`)
        .setFooter(`Executed at ${dateString} | ${timeString}`, 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/e/e9/Book_and_Quill_JE2_BE2.png/revision/latest/scale-to-width-down/160?cb=20190530235621')
		.setDescription(`The HyGuard project was created to be an early warning system to alert users to prevent other nefarious individuals from hijacking your Minecraft account. It works by sending you your status on Hypixel on an interval, and alerting you on any unusual activity. This bot isn't most user friendly, but used the right way, it works.`)
		.addField(`Bug Reports and Suggestions`, `Please report any bugs, exploits, or any suggestions to Attituding#6517. Join the Hypixel Discord before you DM me so that you won't get blocked by Clyde.`)
		.addField('Warning', `I reserve the right to terminate any user who I believe is abusing the system. Additionally, please do not delete the channels that the bot creates or attempt to modify the bot's permissions. I can see who deletes and modifies information on my end, and will remove and block your profile from the database.`)
		.addField(`GitHub`, `This project has a GitHub page, where the code is available under the MIT license! There is also extra documentation there incase you need it. <https://github.com/Attituding/HyGuard> \n\u200B`)
		.addField('**Available Commands**', `You can send \`${prefix}help <command name>\` to get info on a specific command, along with aliases that can also execute the same command!\n`)

			for (let i = 0; i < commandName.length; i++) {
				commandHelp.addField(`${commandName[i]}`, `${commandTitle[i]}`, true)
			  }

			return message.author.send(commandHelp)
				.then(() => {
					if (message.channel.type === 'dm') return;
					message.channel.send(`${message.author}, a DM has been sent to you with basic information and all available commands!`);
				})
				.catch(error => {
					console.error(`Could not send help DM to ${message.author.tag}.\n`, error);
					message.channel.send(`${message.author}, it seems like this bot cannot DM you! Turn on \`Allow direct messages from server members\` in the privacys settings of this server!`).then(async msg => {
		setTimeout(() => {msg.delete();}, 10000);});
				});
		}

		const name = args[0].toLowerCase();
		const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

		if (!command) {
			return message.channel.send(`${message.author}, that\'s not a valid command!`).then(async msg => {
		setTimeout(() => {msg.delete();}, 10000);});
		}

    const commandHelp = new Discord.MessageEmbed()
        .setColor('#7289DA')
        .setTitle(`${prefix}${command.name}`)
        .setFooter(`Executed at ${dateString} | ${timeString}`, 'https://static.wikia.nocookie.net/minecraft_gamepedia/images/e/e9/Book_and_Quill_JE2_BE2.png/revision/latest/scale-to-width-down/160?cb=20190530235621');
		if (command.description) commandHelp.setDescription(`${command.description}`);
        if (command.aliases) commandHelp.addField(`Aliases`, `${prefix + command.aliases.join(`, ${prefix}`)}`);
        if (command.usage) commandHelp.addField(`Usage`, `${command.usage}`);
        if (command.cooldown != undefined) commandHelp.addField(`Cooldown`, `${command.cooldown} second(s)`);
        if (command.permissions || command.ownerReq) commandHelp.addField(`Required Permission(s)`, `${command.permissions && command.ownerReq ? `${command.permissions}\nBot Owner` : `${command.permissions ? `${command.permissions}` : `Bot Owner` }` }`);
message.reply(commandHelp);
	},
};