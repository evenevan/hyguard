const fs = require('fs');
const { prefix } = require('../../userConfig.json');
module.exports = {
	name: 'reload',
	title: 'Clears the cache of a command',
	description: 'Reloads a command',
  usage: `\`${prefix}reload <command>\``,
  aliases: ['rld'],
  guildOnly: true,
	args: true,
  database: false,
  ownerReq: true,
  permissions: ["VIEW_CHANNEL","SEND_MESSAGES"],
	execute(message, args) {
		const commandName = args[0].toLowerCase();
		const command = message.client.commands.get(commandName)
			|| message.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

		if (!command) {
			return message.channel.send(`${message.author}, there is no command with name or alias \`${prefix}${commandName}\`!`);
		}

		const commandFolders = fs.readdirSync('./commands');
		const folderName = commandFolders.find(folder => fs.readdirSync(`./commands/${folder}`).includes(`${command.name}.js`));

		delete require.cache[require.resolve(`../${folderName}/${command.name}.js`)];

		try {
			const newCommand = require(`../${folderName}/${command.name}.js`);
			message.client.commands.set(newCommand.name, newCommand);
			message.channel.send(`Command \`${newCommand.name}\` was reloaded!`)
			console.log(`Command ${newCommand.name} was reloaded!`);
		} catch (error) {
			console.error(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | ${error}`);
			message.channel.send(`${message.author}, there was an error while reloading a command \`${command.name}\`:\n\`${error.message}\``);
		}
	},
};