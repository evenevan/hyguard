const { prefix } = require('../../userConfig.json');
module.exports = {
	name: 'shutdown',
  title: 'Shuts down the bot',
	description: 'Shuts down the bot',
  usage: `\`${prefix}shutdown\``,
  ownerReq: true,
  database: false,
	execute(message, args, client) {
		message.channel.send('Shutting down...').then(m => {
        client.destroy();
      });
	},
};