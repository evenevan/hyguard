const funcImports = require( __dirname + '../../../functions'); //reference code, this was added to setup, but was not tested.
const { prefix } = require('../../userConfig.json');
const databaseImports = require('../../databaseFuncs');
const sqlite = require('sqlite3').verbose();
const fetch = require('node-fetch');
const Discord = require('discord.js');
module.exports = {
	name: 'leaveguild',
  title: 'Forces the bot to leave a guild',
	description: 'Leave a guild',
    usage: `\`${prefix}\``,
  cooldown: 0,
  ownerReq: true,
  args: true,
  database: false,
  permissions: ["VIEW_CHANNEL","SEND_MESSAGES","READ_MESSAGE_HISTORY"],
	execute(message, args, client) {
    
    try {
        leaveGuild();
    async function leaveGuild() {
        let guild = await client.guilds.cache.get(`${args[0]}`);

        if (!guild) return message.channel.send(`That doesn't seem to be a valid guild!`);

        let guildOwner = await client.users.fetch(guild.ownerID);
        guild.leave();
        return message.channel.send(`Bot has left this guild: ${args[0]} | "${guild.name}".\nGuild Owner: ${guildOwner} | ${guildOwner.id}\nGuild Members: ${guild.memberCount - 1}\n${JSON.stringify(guild.members.cache)}`, { split: true });
        }

    } catch (err) {
        try {
            message.channel.send(`Minor error while attempting to leave a guild. ${err}`);
        } catch (err) {
            console.log(`Major error while attemtping to leave a guild. ${err}`);
        }
    }
    },
};

