const { prefix } = require('../../userConfig.json');
const sqlite = require('sqlite3').verbose();
const databaseImports = require('../../databaseFuncs');
const fetch = require('node-fetch');
const Discord = require('discord.js');
module.exports = {
	name: 'exit',
  title: 'Allows players to stop using HyGuard',
	description: 'Allows users to delete their data and stop the use of HyGuard',
	usage: `\`${prefix}exit <Minecrfat Username> <Your UTC Offset>\` \`Example: ${prefix}exit Attituding -7\``,
  cooldown: 10,
  database: true,
  permissions: ["MANAGE_CHANNELS","ADD_REACTIONS","VIEW_CHANNEL","SEND_MESSAGES","READ_MESSAGE_HISTORY"],
  guildPermissions: [],
	execute(message, args, client) {
        try {
message.channel.send('Deleting..').then(async loadingmsg => {
  getData();

  async function getData() {
    try {
      let rowRespoonse = await databaseImports.getData(message.author.id);

        loadingmsg.delete();
        message.channel.send(`${message.author}, you are about to delete all of your data. Confirm with a thumb up or deny with a thumb down.`).then(msg => {
          msg.react('👍')
          .then(() => {msg.react('👎');})
          .catch(err => {
            console.error(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | Caught an error while executing a command from ${message.author.tag}.\n`, err);
          });
          msg.awaitReactions((reaction, user) => user.id == message.author.id && (reaction.emoji.name == '👍' || reaction.emoji.name == '👎'), {
            max: 1,
            time: 30000
          }).then(collected => {
            if (collected.first().emoji.name == '👍') {

              deleteCategory();

              async function deleteChannels() {
                let guild = await client.guilds.cache.get(`${rowRespoonse.guildID}`);
                if (!guild) return;

                let log = await guild.channels.cache.get(rowRespoonse.logID);
                let alert = await guild.channels.cache.get(rowRespoonse.alertID);

                if (log) log.delete().catch(err => {console.error(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | Caught an error while deleting the log while executing a command from ${message.author.tag}.\n`, err);});
                if (alert) alert.delete().catch(err => {console.error(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | Caught an error while deleting the alert channel while executing a command from ${message.author.tag}.\n`, err);});
                return;
              };

              async function deleteCategory() {
                await deleteChannels();
                
                let guild = client.guilds.cache.get(`${rowRespoonse.guildID}`);

                if (guild) {
                  let category = guild.channels.cache.find(c => c.name == "log" && c.type == "category");
                  if (category.children.size == 0) {
                    category.delete().catch(err => {console.error(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | Caught an error while deleting a category while executing a command from ${message.author.tag}.\n`, err);});
                  }
                } 

                deleteData();
              };
              
              async function deleteData() {
                try {
                  await databaseImports.deleteData(message.author.id);

                  msg.delete();
                  return message.channel.send(`${message.author}, done! Your data has been deleted from the database.`);

                } catch (err) {
                  message.channel.send(`${message.author}, ${err}`);
                  console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | ${err}`);
                }
              };

            } else if (collected.first().emoji.name !== '👍') {
              msg.delete();
              message.channel.send(`${message.author}, Operation canceled.`);
            }
          }).catch(() => {
            msg.delete();
            message.channel.send(`${message.author}, no reaction after 30 seconds, operation canceled`);
          });
        });
    } catch (err) {
      console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | An error occured while fetching data. ${err}`);
      message.channel.send(`${message.author}, an error occured while fetching data. Please report this. \`${err}\``);
    }
  };
})
        } catch (err) {
            console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | An error occured while writing data. ${err}`);
			message.channel.send(`${message.author}, an error occured while writing data. Please report this. \`${err}\``);
        }
    },
};
