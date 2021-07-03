const { prefix } = require('../../userConfig.json');
module.exports = {
	name: 'ping',
	title: 'Displays the ping of the bot',
	description: 'Shows the ping of the bot!',
  database: false,
  cooldown: 5,
	execute(message, args, client) {
		try {
			message.channel.send('Loading data').then(async msg => {
				msg.delete();
				message.channel.send(
					`🏓 Ping! Latency is ${msg.createdTimestamp -
						message.createdTimestamp}ms. API Latency is ${Math.round(
						client.ws.ping
					)}ms`
				);
			});
		} catch (err) {
		console.log(`Error 11: ${err}`);
		message.channel.send(`An unknown error occured. Please report this. ERROR_11: \`${err}\``);
		}
	},
};