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
  permissions: ["MANAGE_CHANNELS","ADD_REACTIONS","VIEW_CHANNEL","SEND_MESSAGES","EMBED_LINKS","READ_MESSAGE_HISTORY"],
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
          msg.react('👎');
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

                if (log) log.delete();
                if (alert) alert.delete();
                return;
              };

              async function deleteCategory() {
                await deleteChannels();
                
                let guild = client.guilds.cache.get(`${rowRespoonse.guildID}`);

                if (guild) {
                  let category = guild.channels.cache.find(c => c.name == "log" && c.type == "category");
                  if (category.children.size == 0) {
                    category.delete();
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
                  message.channel.send(err);
                  console.log(`Error 15: ${err}`);
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
      console.log(`ERROR_3: ${err}`);
      message.channel.send(`An error occured while fetching data. Please report this. ERROR_3: \`${err}\``);
    }
  };
})
        } catch (err) {
            console.log(`ERROR_3: ${err}`);
			message.channel.send(`An error occured while writing data. Please report this. ERROR_3: \`${err}\``);
        }
    },
};
