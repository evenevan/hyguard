const funcImports = require( __dirname + '../../../functions'); //reference code, this was added to setup, but was not tested.
const { prefix } = require('../../userConfig.json');
const databaseImports = require('../../databaseFuncs');
const sqlite = require('sqlite3').verbose();
const fetch = require('node-fetch');
const Discord = require('discord.js');
module.exports = {
	name: 'guildinfo',
  title: 'Gives insight when diagnosing an error',
	description: 'Gives insight when diagnosing an error',
    usage: `\`${prefix}guildinfo <guildID>\``,
  cooldown: 0,
  ownerReq: true,
  args: true,
  database: false,
  permissions: ["VIEW_CHANNEL","SEND_MESSAGES"],
	execute(message, args, client) {
    
    try {
        getGuildInfo();
    async function getGuildInfo() {
        let guild = await client.guilds.cache.get(`${args[0]}`);

        if (!guild) return message.channel.send(`${message.author}, that doesn't seem to be a valid guild!`);

        let guildOwner = await client.users.fetch(guild.ownerID);
        return message.channel.send(`${message.author}, ${args[0]} | "${guild.name}".\nGuild Owner: ${guildOwner.id}\nGuild Members: ${guild.memberCount - 1}\n${JSON.stringify(guild.members.cache)}`, { split: true });
        
    }

    } catch (err) {
        try {
            message.channel.send(`${message.author}, minor error while attempting to leave a guild. ${err}`);
        } catch (err) {
            console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | Major error while attemtping to leave a guild. ${err}`);
        }
    }
    },
};

