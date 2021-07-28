const { prefix } = require('../../userConfig.json');
module.exports = {
	name: 'ping',
	title: 'Displays the ping of the bot',
	description: 'Shows the ping of the bot!',
  database: false,
  cooldown: 5,
  permissions: ["VIEW_CHANNEL","SEND_MESSAGES"],
	execute(message, args, client) {
		try {
			message.channel.send('Loading data').then(async msg => {
				msg.delete().then(() => {
					message.channel.send(
						`🏓 Ping! Latency is ${msg.createdTimestamp -
							message.createdTimestamp}ms. API Latency is ${Math.round(
							client.ws.ping
						)}ms`
					);
				})
			});
		} catch (err) {
		console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | An unknown error occured. ${err}`);
		message.channel.send(`${message.author}, an unknown error occured. Please report this. \`${err}\``);
		}
	},
};