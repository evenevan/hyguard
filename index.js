const fs = require('fs');
const funcImports = require('./functions');
const logImports = require('./log');
const sqlite = require('sqlite3').verbose();
const databaseImports = require('./databaseFuncs');
const Discord = require('discord.js');
const client = new Discord.Client
const userConfig = require('./userConfig.json');
const discordAPIkey = userConfig["discordAPIkey"];
const prefix = userConfig["prefix"];
const botOwner = userConfig["BotOwnerID"];
const logInterval = userConfig["logInterval"];
process.env.TZ = userConfig["Timezone"];

client.commands = new Discord.Collection();
client.cooldowns = new Discord.Collection();

client.on('ready', () => {
	console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | Logged in as ${client.user.tag}!`);
	client.user
		.setPresence({ activity: { name: `startup | ${prefix}help`, type: 'WATCHING' }, status: 'dnd' })
		.then(presence => {console.log(`${presence.status} ${presence.activities[0].type} ${presence.activities[0].name}`)})
		.catch(console.error);

	let db = new sqlite.Database('./database.db', sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE);
	db.serialize(() => {
		db.run(`CREATE TABLE IF NOT EXISTS data(discordID TEXT NOT NULL, discordUsername TEXT NOT NULL, minecraftUUID TEXT NOT NULL, language TEXT NOT NULL, version TEXT NOT NULL, offline INTEGER NOT NULL, blacklist TEXT, whitelist TEXT, loginMS INTEGER, logoutMS INTEGER, timezone INTEGER NOT NULL, daylightSavings INTEGER NOT NULL, alerts TEXT NOT NULL, guildID TEXT NOT NULL, logID TEXT NOT NULL, alertID TEXT NOT NULL, log INTEGER NOT NULL, advanced TEXT)`);
		db.close();
	  })
	  setTimeout(() => {setInterval(logImports.logStarter, logInterval * 1000, client)}, 2500);
});

const commandFolders = fs.readdirSync('./commands');

for (const folder of commandFolders) {
	const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const command = require(`./commands/${folder}/${file}`);
		client.commands.set(command.name, command);
	}
}

client.on('message', message => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const commandName = args.shift().toLowerCase();

	const command = client.commands.get(commandName)
		|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

	if (!command) return;

checkPermsOfBot();

async function checkPermsOfBot() {
	if (message.channel.type !== 'dm') {
	  try {
		  if (command.permissions && command.guildPermissions) {
		  const channelPermissions = command.permissions;
		  const guildPermissions = command.guildPermissions;
		  let returned = await funcImports.checkPermsOfBot(message.channel, channelPermissions, guildPermissions, message.guild.me);
		  if (returned) {
			  let type = returned.pop()
			  console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | Missing Permissions. User: ${message.author.tag} | ${message.author.id} GuildID: ${message.guild.id}. Content: ${message.content}. User is missing ${type === "BOTH" ? `Channel: ${returned[0]} Guild: ${returned[1]}`: `${type}: ${returned[0]}`}`);
			  return message.channel.send(`${message.author}, this bot is missing the following permissions(s) for that command: ${type === "BOTH" ? `${returned[0]}. The permission(s) ${returned[1]} must be given at a server-wide level through the bot's role.` : `${returned[0]}. ${type == "CHANNEL" ? `If the bot's roles appear to contain all of these permissions, check the channel's advanced permissions.` : `These permission(s) must be given at a server-wide level through the bot's role.`}`}`);
		  }
		  checkDB();
		  } else {
			  console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | A command was not set up properly and is missing a permission configuration. User: ${message.author.tag} | ${message.author.id}${message.guild ? ` GuildID: ${message.guild.id}` : ``} Content: ${message.content}.`);
			  return message.channel.send(`${message.author}, this command was not set up correctly by the owner. Please notify them. It is missing a permission configuration.`);
		  }
	  } catch (err) {
		console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | A user is attempting to use the bot without essential permissions. User: ${message.author.tag} | ${message.author.id}${message.guild ? ` GuildID: ${message.guild.id}` : ``} Content: ${message.content}. User is missing ${err[0]} in a channel.${!err[1] ? `` : ` ${err[1]} is missing in the guild.`}`);
		return message.author.send(`This bot is missing the following permissions(s) the command ${prefix}${commandName}: ${err[0]}.${!err[1] ? `` : ` This bot is also missing ${err[1]}, which must be given at a server-wide level through the bot's role.`} **Send Messages** is an essential permission to this bot's function. If the bot's roles appear to have all of these permissions, check the channel's advanced permissions.`).then(() => {console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | Missing Permissions DM sent`)}).catch(error => {console.error(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | Could not send a missing permissions DM to ${message.author.tag}.\n`, error);});
	  }	
	} else {
		  checkDB()
	}
};


async function checkDB() {
	var isInDB = await databaseImports.isInDataBase(message.author.id)
	console.log(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | DB ${isInDB[0]} User: ${message.author.tag} ${message.author.id} ${message.guild ? `GuildID: ${message.guild.id}` : ``} made a request: ${message.content}`)
	if (isInDB[0] == false && command.database == true) return message.channel.send(`${message.author}, you must use \`${prefix}setup\` first before using this command!`);
	dm(isInDB[1]);
};
	
function dm(rowData) {
	if (command.guildOnly && message.channel.type === 'dm') {
		return message.channel.send(`${message.author}, you can\'t execute that command inside DMs!`);
	}
	owner(rowData);
};

function owner(rowData) {
	if (command.ownerReq) {
		const authorID = message.author.id
		if (!botOwner.includes(authorID)) {
			return message.channel.send(`${message.author}, you must be the owner to do this!`);
		}
	}
	argument(rowData);
};

function argument(rowData) {
	if (command.args && !args.length) {
		let reply = `You didn't provide any arguments, ${message.author}!`;

		if (command.usage) {
			reply += `\nThe proper usage would be: ${command.usage}`;
		}

		return message.channel.send(reply);
	}
	cooldown(rowData);
};

function cooldown(rowData) {
	const { cooldowns } = client;

	if (!cooldowns.has(command.name)) {
		cooldowns.set(command.name, new Discord.Collection());
	}

	const now = Date.now();
	const timestamps = cooldowns.get(command.name);
	const cooldownAmount = (command.cooldown || 1) * 1000;

	if (timestamps.has(message.author.id) && !botOwner.includes(message.author.id)) {
		const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

		if (now < expirationTime) {
			const timeLeft = (expirationTime - now) / 1000;
			return message.channel.send(`${message.author}, please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${prefix}${command.name}\` command.`).then(async msg =>{setTimeout(() => {msg.delete();}, timeLeft * 1000);});
		}
	}

	timestamps.set(message.author.id, now);
	setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
	tryToExecute(rowData);
};

function tryToExecute(rowData) {
	try {
		command.execute(message, args, client, rowData);
	} catch (error) {
		console.error(`${new Date().toLocaleTimeString('en-IN', { hour12: true })} UTC ±0 | ${error}`);
		return message.channel.send(`${message.author}, there was an error trying to execute that command! Please report this. Error: \`${error}\``);
	}
};

});

client.login(discordAPIkey);
